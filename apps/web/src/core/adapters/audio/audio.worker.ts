import { pipeline, env } from '@huggingface/transformers';
import { MainThreadMessageDTO, WorkerMessageDTO } from '../../ports/audio/types';

// Deshabilitar la búsqueda de modelos locales en el sistema de archivos del servidor
env.allowLocalModels = false;

// Variables globales para el patrón Singleton del modelo
let pipelineInstance: unknown = null;
let currentModelName: string | null = null;
let currentDtype: string | null = null;

/**
 * Verifica la cuota de espacio disponible en disco usando navigator.storage.estimate().
 * Lanza un error controlado si no hay suficiente espacio para el modelo.
 * 
 * @param requiredBytes - Espacio mínimo requerido (por defecto 150MB para CrisperWhisper-ONNX cuantizado)
 */
async function checkStorageQuota(requiredBytes: number = 150 * 1024 * 1024): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const freeSpace = quota - usage;
    
    if (freeSpace < requiredBytes) {
      throw new Error(
        `Espacio de almacenamiento insuficiente. Se requiere un mínimo de ` +
        `${Math.round(requiredBytes / (1024 * 1024))}MB, pero solo quedan ` +
        `${Math.round(freeSpace / (1024 * 1024))}MB disponibles en el navegador.`
      );
    }
  }
}

interface ProgressData {
  status: string;
  progress?: number;
  file?: string;
}

/**
 * Inicializa y descarga el modelo utilizando Transformers.js/ONNX Runtime.
 * Maneja el patrón Singleton, progreso y fallbacks.
 * 
 * @param modelName - Nombre o ruta del modelo en Hugging Face Hub
 * @param dtype - Nivel de cuantización o precisión del modelo (q8, q4, fp32)
 */
async function loadModel(modelName: string, dtype: string): Promise<void> {
  try {
    // 1. Verificación previa de cuota de disco
    await checkStorageQuota(150 * 1024 * 1024);

    // Callback para monitorear el progreso de descarga de los shards del modelo
    const progressCallback = (data: ProgressData) => {
      if (data.status === 'progress' || data.status === 'downloading') {
        const progressValue = typeof data.progress === 'number' ? Math.round(data.progress) : 0;
        const progressMessage: WorkerMessageDTO = {
          type: 'PROGRESS',
          payload: {
            status: 'downloading',
            progress: progressValue,
            stage: 'downloading',
            message: `Descargando archivo del modelo: ${data.file || ''} (${progressValue}%)`
          }
        };
        self.postMessage(progressMessage);
      } else if (data.status === 'init') {
        const progressMessage: WorkerMessageDTO = {
          type: 'PROGRESS',
          payload: {
            status: 'loading',
            progress: 90,
            stage: 'loading',
            message: `Compilando tensores e inicializando sesión de ONNX Runtime...`
          }
        };
        self.postMessage(progressMessage);
      }
    };

    // 2. Intentar cargar con WebGPU
    const progressMessage: WorkerMessageDTO = {
      type: 'PROGRESS',
      payload: {
        status: 'loading',
        progress: 10,
        stage: 'loading',
        message: 'Detectando soporte y compilando pipelines WebGPU...'
      }
    };
    self.postMessage(progressMessage);

    pipelineInstance = await pipeline('automatic-speech-recognition', modelName, {
      device: 'webgpu',
      dtype: dtype as 'q8' | 'fp32',
      progress_callback: progressCallback,
    });

    currentModelName = modelName;
    currentDtype = dtype;

    // Confirmar que el modelo está cargado con WebGPU
    self.postMessage({ type: 'READY' });
  } catch (webgpuError: unknown) {
    const errorDetails = webgpuError instanceof Error ? webgpuError.message : String(webgpuError);
    // 3. Fallback automático a CPU (WASM) si falla WebGPU
    const fallbackProgressMessage: WorkerMessageDTO = {
      type: 'PROGRESS',
      payload: {
        status: 'loading',
        progress: 30,
        stage: 'loading',
        message: `WebGPU no disponible o falló: ${errorDetails}. Activando fallback a CPU (WASM)...`
      }
    };
    self.postMessage(fallbackProgressMessage);

    try {
      pipelineInstance = await pipeline('automatic-speech-recognition', modelName, {
        device: 'wasm',
        dtype: dtype as 'q8' | 'fp32',
        progress_callback: (data: ProgressData) => {
          if (data.status === 'progress' || data.status === 'downloading') {
            const progressValue = typeof data.progress === 'number' ? Math.round(data.progress) : 0;
            self.postMessage({
              type: 'PROGRESS',
              payload: {
                status: 'downloading',
                progress: progressValue,
                stage: 'downloading',
                message: `Descargando archivos (WASM Fallback): ${data.file || ''} (${progressValue}%)`
              }
            });
          } else if (data.status === 'init') {
            self.postMessage({
              type: 'PROGRESS',
              payload: {
                status: 'loading',
                progress: 95,
                stage: 'loading',
                message: `Inicializando ONNX Runtime en modo WebAssembly...`
              }
            });
          }
        },
      });

      currentModelName = modelName;
      currentDtype = dtype;

      self.postMessage({ type: 'READY' });
    } catch (wasmError: unknown) {
      const wasmErrorObj = wasmError instanceof Error ? wasmError : new Error(String(wasmError));
      // Error fatal en ambas tecnologías
      self.postMessage({
        type: 'ERROR',
        payload: {
          code: 'MODEL_LOAD_FAILED',
          message: `Fallo completo de inicialización (WebGPU y WASM): ${wasmErrorObj.message}`,
          stack: wasmErrorObj.stack
        }
      });
    }
  }
}

// Escuchar mensajes provenientes del Main Thread
self.addEventListener('message', async (event: MessageEvent<MainThreadMessageDTO>) => {
  const message = event.data;
  if (!message) return;

  switch (message.type) {
    case 'LOAD_MODEL': {
      const modelName = message.payload?.modelName || 'onnx-community/CrisperWhisper-ONNX';
      // Forzar q8 o q4 por defecto para evitar OOM, o fp32 si se desactiva explícitamente la cuantización
      const quantized = message.payload?.quantized !== false;
      const dtype = quantized ? 'q8' : 'fp32';

      // Comprobación de Singleton
      if (pipelineInstance && currentModelName === modelName && currentDtype === dtype) {
        self.postMessage({ type: 'READY' });
        return;
      }

      await loadModel(modelName, dtype);
      break;
    }
    case 'TERMINATE': {
      // Liberar recursos y cerrar el worker
      pipelineInstance = null;
      currentModelName = null;
      currentDtype = null;
      self.close();
      break;
    }
    default:
      break;
  }
});
