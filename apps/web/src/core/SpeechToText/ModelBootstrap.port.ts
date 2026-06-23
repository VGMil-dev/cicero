import { ProgressDTO, AudioCaptureState } from '../shared/types';

/**
 * Interface for the AI model initialization service.
 * Handles the preparation of the inference environment (Web Worker and ONNX models).
 * 
 * @example
 * ```typescript
 * const bootstrap: ModelBootstrap = new TransformersBootstrap();
 * bootstrap.onProgress((p) => console.log(`Loading: ${p.progress}%`));
 * await bootstrap.initialize();
 * ```
 */
export interface ModelBootstrap {
  /**
   * Starts the download and preparation of the AI model.
   * Resolves when the model is ready for inference.
   * 
   * @throws {ErrorDTO} If the download fails or the environment is not supported.
   */
  initialize(): Promise<void>;

  /**
   * Subscribes to model loading progress events.
   * 
   * @param callback - Function called with progress updates.
   */
  onProgress(callback: (progress: ProgressDTO) => void): void;

  /**
   * Returns the current state of the initialization process.
   * 
   * @returns The current {@link AudioCaptureState}.
   */
  getState(): AudioCaptureState;

  /**
   * Safe termination of the initialization process or Web Worker,
   * releasing loaded resources and memory.
   * 
   * @example
   * ```typescript
   * bootstrap.terminate();
   * ```
   */
  terminate(): void;

  /**
   * Returns the active Web Worker instance if initialized, or null.
   * Useful for hooking direct worker events (like global errors/onerror).
   * 
   * @returns The active {@link Worker} instance, or null.
   * @example
   * ```typescript
   * const worker = bootstrap.getWorkerInstance();
   * if (worker) {
   *   worker.onerror = (e) => console.error(e);
   * }
   * ```
   */
  getWorkerInstance?(): Worker | null;
}
