import { PermissionsDTO } from './types';

export interface IAudioRecorder {
  /** Requests necessary hardware permissions (Microphone) */
  requestPermissions(): Promise<PermissionsDTO>;

  /** Starts the audio stream capture */
  startRecording(): Promise<void>;

  /** Stops recording and returns the captured audio Blob */
  stopRecording(): Promise<Blob>;

  /** Aborts the current recording without saving results */
  cancelRecording(): void;
}
