import { ProgressDTO, AudioCaptureState } from './types';

/**
 * Interface for the AI model initialization service.
 * Handles the preparation of the inference environment (Web Worker and ONNX models).
 * 
 * @example
 * ```typescript
 * const bootstrap: IAudioModelBootstrap = new TransformersBootstrap();
 * bootstrap.onProgress((p) => console.log(`Loading: ${p.progress}%`));
 * await bootstrap.initialize();
 * ```
 */
export interface IAudioModelBootstrap {
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
}
