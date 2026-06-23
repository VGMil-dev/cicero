import { PermissionsDTO } from '../shared/types';

/**
 * Interface for the hardware audio capture service.
 * Abstracts the interaction with the browser's MediaDevices API.
 */
export interface AudioRecorder {
  /**
   * Requests necessary hardware permissions (Microphone) from the user.
   * 
   * @returns A promise resolving to the status of permissions in a {@link PermissionsDTO}.
   */
  requestPermissions(): Promise<PermissionsDTO>;

  /**
   * Starts the audio stream capture from the microphone.
   * 
   * @throws {ErrorDTO} If the microphone is unavailable or permission was denied.
   */
  startRecording(): Promise<void>;

  /**
   * Stops the current recording and releases the microphone.
   * 
   * @returns A promise resolving to a {@link Blob} containing the captured audio data.
   */
  stopRecording(): Promise<Blob>;

  /**
   * Aborts the current recording process and cleans up resources.
   * No data is saved or returned.
   */
  cancelRecording(): void;
}
