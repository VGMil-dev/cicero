import { ProgressDTO, AudioCaptureState } from './types';

export interface IAudioModelBootstrap {
  /** Starts the download/preparation of the AI model */
  initialize(): Promise<void>;

  /** Subscription to progress events for UI updates */
  onProgress(callback: (progress: ProgressDTO) => void): void;

  /** Returns the current state of the initialization process */
  getState(): AudioCaptureState;
}
