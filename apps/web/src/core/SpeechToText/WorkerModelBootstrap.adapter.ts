import { ModelBootstrap } from './ModelBootstrap.port';
import { AudioCaptureState, ProgressDTO, WorkerMessageDTO, MainThreadMessageDTO } from '../shared/types';
import { CaptureError } from '../shared/CaptureError';

/**
 * Opciones para configurar la inicialización del modelo de audio.
 */
export interface WorkerAudioModelBootstrapOptions {
  /** El nombre del modelo que se cargará (por defecto 'onnx-community/CrisperWhisper-ONNX') */
  modelName?: string;
  /** Flag para forzar la cuantización (q8/q4) y prevenir falta de memoria (OOM) */
  quantized?: boolean;
}

/**
 * Adaptador que implementa {@link ModelBootstrap} para la inicialización
 * y descarga del modelo de voz local en un Web Worker en segundo plano.
 * 
 * Gestiona el ciclo de vida del Web Worker, intercepta y procesa los mensajes del hilo
 * secundario, reporta el progreso detallado a la UI y traduce errores en instancias de {@link CaptureError}.
 * 
 * @example
 * ```typescript
 * const bootstrap = new WorkerModelBootstrap({ quantized: true });
 * bootstrap.onProgress((p) => console.log(`Cargado: ${p.progress}% - ${p.message}`));
 * await bootstrap.initialize();
 * ```
 */
export class WorkerModelBootstrap implements ModelBootstrap {
  private worker: Worker | null = null;
  private state: AudioCaptureState = 'idle';
  private progressCallback: ((progress: ProgressDTO) => void) | null = null;
  private modelName: string;
  private quantized: boolean;
  
  // Promesas diferidas para gestionar peticiones concurrentes o llamadas asíncronas
  private resolveInit: (() => void) | null = null;
  private rejectInit: ((error: CaptureError) => void) | null = null;

  /**
   * Crea una instancia de WorkerAudioModelBootstrap.
   * 
   * @param options - Configuración del modelo y descarga, {@link WorkerAudioModelBootstrapOptions}
   */
  constructor(options: WorkerAudioModelBootstrapOptions = {}) {
    this.modelName = options.modelName || 'onnx-community/CrisperWhisper-ONNX';
    this.quantized = options.quantized !== false;
  }

  /**
   * Inicia el Web Worker y comienza la descarga y preparación del modelo.
   * Devuelve una promesa que se resuelve cuando el modelo está cargado y listo.
   * 
   * @throws {CaptureError} Si el almacenamiento es insuficiente o falla la compilación del modelo.
   */
  async initialize(): Promise<void> {
    if (this.state === 'ready') {
      return;
    }

    if (this.state === 'loading-model') {
      // Retornar la promesa existente si ya está en curso
      return new Promise<void>((resolve, reject) => {
        const prevResolve = this.resolveInit;
        const prevReject = this.rejectInit;
        this.resolveInit = () => {
          if (prevResolve) prevResolve();
          resolve();
        };
        this.rejectInit = (err) => {
          if (prevReject) prevReject(err);
          reject(err);
        };
      });
    }

    this.state = 'loading-model';

    return new Promise<void>((resolve, reject) => {
      this.resolveInit = resolve;
      this.rejectInit = reject;

      try {
        // Sintaxis nativa de Web Worker en Next.js
        this.worker = new Worker(
          new URL('./Transformers.worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Manejador de eventos entrantes desde el Web Worker
        this.worker.onmessage = (event: MessageEvent<WorkerMessageDTO>) => {
          this.handleWorkerMessage(event.data);
        };

        // Capturar pánicos globales del hilo secundario (ej. errores de compilación WASM)
        this.worker.onerror = (errorEvent) => {
          this.handleWorkerPanic(errorEvent);
        };

        // Enviar la señal de carga
        const loadMessage: MainThreadMessageDTO = {
          type: 'LOAD_MODEL',
          payload: {
            modelName: this.modelName,
            quantized: this.quantized,
          },
        };
        this.worker.postMessage(loadMessage);
      } catch (err) {
        this.state = 'error';
        const errorObj = err instanceof Error ? err : new Error(String(err));
        const captureError = new CaptureError(
          'MODEL_LOAD_FAILED',
          `Fallo al instanciar el Web Worker en Next.js: ${errorObj.message}`,
          err
        );
        reject(captureError);
      }
    });
  }

  /**
   * Suscribe un callback para recibir actualizaciones detalladas de progreso.
   * 
   * @param callback - Función receptora de actualizaciones de progreso.
   */
  onProgress(callback: (progress: ProgressDTO) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Retorna el estado actual de la inicialización de audio.
   * 
   * @returns El estado actual de tipo {@link AudioCaptureState}.
   */
  getState(): AudioCaptureState {
    return this.state;
  }

  /**
   * Termina y descarta el Web Worker en ejecución de forma segura, liberando memoria.
   */
  terminate(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'TERMINATE' });
      } catch {
        // Ignorar si el canal ya estaba cerrado
      }
      this.worker.terminate();
      this.worker = null;
    }
    this.state = 'idle';
    this.resolveInit = null;
    this.rejectInit = null;
  }

  /**
   * Retorna la instancia interna del Web Worker (útil para suscripciones a nivel de UI).
   * 
   * @returns El objeto {@link Worker} nativo actual, o null si no se ha inicializado.
   */
  getWorkerInstance(): Worker | null {
    return this.worker;
  }

  private handleWorkerMessage(message: WorkerMessageDTO): void {
    if (!message) return;

    switch (message.type) {
      case 'PROGRESS': {
        if (this.progressCallback) {
          this.progressCallback(message.payload);
        }
        break;
      }
      case 'READY': {
        this.state = 'ready';
        if (this.resolveInit) {
          this.resolveInit();
          this.resolveInit = null;
          this.rejectInit = null;
        }
        break;
      }
      case 'ERROR': {
        this.state = 'error';
        const errorPayload = message.payload;
        const captureError = new CaptureError(
          errorPayload.code,
          errorPayload.message,
          errorPayload.details
        );
        if (errorPayload.stack) {
          captureError.stack = errorPayload.stack;
        }
        if (this.rejectInit) {
          this.rejectInit(captureError);
          this.rejectInit = null;
          this.resolveInit = null;
        }
        break;
      }
    }
  }

  private handleWorkerPanic(errorEvent: ErrorEvent): void {
    this.state = 'error';
    const captureError = new CaptureError(
      'WASM_PANIC',
      `Fallo crítico de ejecución en el Web Worker: ${errorEvent.message || 'Error desconocido'}`,
      errorEvent
    );

    if (this.rejectInit) {
      this.rejectInit(captureError);
      this.rejectInit = null;
      this.resolveInit = null;
    }

    if (this.progressCallback) {
      this.progressCallback({
        status: 'panic',
        progress: 0,
        stage: 'panic',
        message: errorEvent.message,
        error: {
          code: 'WASM_PANIC',
          message: errorEvent.message,
          stack: `Error en ${errorEvent.filename}:${errorEvent.lineno}:${errorEvent.colno}`
        }
      });
    }
  }
}
