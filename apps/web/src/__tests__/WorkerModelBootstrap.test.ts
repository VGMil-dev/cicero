import { WorkerModelBootstrap } from '../core/SpeechToText/WorkerModelBootstrap.adapter';
import { CaptureError } from '../core/shared/CaptureError';
import { ProgressDTO } from '../core/shared/types';

interface MockWorkerInstance {
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((error: ErrorEvent) => void) | null;
  postMessage: jest.Mock;
  terminate: jest.Mock;
}

interface MockWorkerConstructor {
  instances: MockWorkerInstance[];
}

describe('WorkerModelBootstrap Adapter', () => {
  let MockWorkerClass: MockWorkerConstructor;

  beforeEach(() => {
    // Limpiar las instancias creadas en el mock global
    MockWorkerClass = (global as unknown as { MockWorker: MockWorkerConstructor }).MockWorker;
    MockWorkerClass.instances = [];
    jest.clearAllMocks();
  });

  describe('Constructor & State', () => {
    it('should initialize with default model and idle state', () => {
      const bootstrap = new WorkerModelBootstrap();
      expect(bootstrap.getState()).toBe('idle');
      expect(bootstrap.getWorkerInstance()).toBeNull();
    });

    it('should configure custom options', () => {
      const bootstrap = new WorkerModelBootstrap({
        modelName: 'onnx-community/test-model',
        quantized: false,
      });
      expect(bootstrap.getState()).toBe('idle');
    });
  });

  describe('initialize() success flow', () => {
    it('should create worker and resolve when receiving READY message', async () => {
      const bootstrap = new WorkerModelBootstrap();
      
      const initPromise = bootstrap.initialize();
      expect(bootstrap.getState()).toBe('loading-model');

      const workerInstance = MockWorkerClass.instances[0];
      expect(workerInstance).toBeDefined();
      expect(workerInstance.postMessage).toHaveBeenCalledWith({
        type: 'LOAD_MODEL',
        payload: {
          modelName: 'onnx-community/CrisperWhisper-ONNX',
          quantized: true,
        },
      });

      // Simular READY desde el Worker
      if (workerInstance.onmessage) {
        workerInstance.onmessage({
          data: { type: 'READY' },
        });
      }

      await expect(initPromise).resolves.toBeUndefined();
      expect(bootstrap.getState()).toBe('ready');
    });

    it('should reuse ongoing initialize promise if called concurrently', async () => {
      const bootstrap = new WorkerModelBootstrap();
      
      const initPromise1 = bootstrap.initialize();
      const initPromise2 = bootstrap.initialize();

      expect(MockWorkerClass.instances.length).toBe(1);

      const workerInstance = MockWorkerClass.instances[0];
      if (workerInstance.onmessage) {
        workerInstance.onmessage({
          data: { type: 'READY' },
        });
      }

      await Promise.all([initPromise1, initPromise2]);
      expect(bootstrap.getState()).toBe('ready');
    });
  });

  describe('onProgress() monitoring', () => {
    it('should propagate progress updates from Web Worker to subscriber', async () => {
      const bootstrap = new WorkerModelBootstrap();
      const progressSpy = jest.fn();
      bootstrap.onProgress(progressSpy);

      bootstrap.initialize();
      const workerInstance = MockWorkerClass.instances[0];

      const mockProgressPayload: ProgressDTO = {
        status: 'downloading',
        progress: 45,
        stage: 'downloading',
        message: 'Descargando shards...',
      };

      // Simular PROGRESS desde el Worker
      if (workerInstance.onmessage) {
        workerInstance.onmessage({
          data: {
            type: 'PROGRESS',
            payload: mockProgressPayload,
          },
        });
      }

      expect(progressSpy).toHaveBeenCalledWith(mockProgressPayload);
    });
  });

  describe('Error handling and panic scenarios', () => {
    it('should reject with CaptureError if Worker reports an ERROR message', async () => {
      const bootstrap = new WorkerModelBootstrap();
      
      const initPromise = bootstrap.initialize();
      const workerInstance = MockWorkerClass.instances[0];

      // Simular ERROR desde el Worker
      if (workerInstance.onmessage) {
        workerInstance.onmessage({
          data: {
            type: 'ERROR',
            payload: {
              code: 'MODEL_LOAD_FAILED',
              message: 'Disk quota exceeded',
              details: { quota: 200 },
            },
          },
        });
      }

      await expect(initPromise).rejects.toThrow(CaptureError);
      
      try {
        await initPromise;
      } catch (err) {
        const captureError = err as CaptureError;
        expect(captureError.dto.code).toBe('MODEL_LOAD_FAILED');
        expect(captureError.dto.message).toBe('Disk quota exceeded');
        expect(bootstrap.getState()).toBe('error');
      }
    });

    it('should reject with WASM_PANIC and notify subscriber if Web Worker crashes (onerror)', async () => {
      const bootstrap = new WorkerModelBootstrap();
      const progressSpy = jest.fn();
      bootstrap.onProgress(progressSpy);

      const initPromise = bootstrap.initialize();
      const workerInstance = MockWorkerClass.instances[0];

      // Simular evento onerror del Worker (crash fatal)
      const errorEvent = {
        message: 'WASM out of bounds memory access',
        filename: 'audio.worker.js',
        lineno: 120,
        colno: 5,
      };
      
      if (workerInstance.onerror) {
        workerInstance.onerror(errorEvent as unknown as ErrorEvent);
      }

      await expect(initPromise).rejects.toThrow(CaptureError);

      try {
        await initPromise;
      } catch (err) {
        const captureError = err as CaptureError;
        expect(captureError.dto.code).toBe('WASM_PANIC');
        expect(captureError.dto.message).toContain('Fallo crítico de ejecución en el Web Worker: WASM out of bounds memory access');
        expect(bootstrap.getState()).toBe('error');
      }

      // Debe haber notificado de la etapa de panic al suscriptor
      expect(progressSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'panic',
        stage: 'panic',
      }));
    });
  });

  describe('terminate() lifecycle', () => {
    it('should terminate the running worker and reset state to idle', async () => {
      const bootstrap = new WorkerModelBootstrap();
      
      bootstrap.initialize();
      const workerInstance = MockWorkerClass.instances[0];

      bootstrap.terminate();

      expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: 'TERMINATE' });
      expect(workerInstance.terminate).toHaveBeenCalled();
      expect(bootstrap.getState()).toBe('idle');
      expect(bootstrap.getWorkerInstance()).toBeNull();
    });
  });
});
