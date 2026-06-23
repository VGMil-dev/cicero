import { AudioRecorder } from './AudioRecorder.port';
import { RecorderError } from './RecorderError';
import { PermissionsDTO } from '../shared/types';

/**
 * Configuration options for {@link FakeAudioRecorder}.
 */
export interface FakeAudioRecorderOptions {
  /**
   * When `false`, {@link FakeAudioRecorder.requestPermissions} will return
   * `microphoneGranted: false`.
   * @default true
   */
  grantPermission?: boolean;
  /**
   * When `true`, {@link FakeAudioRecorder.startRecording} will reject with
   * `RECORDING_FAILED` after permissions are granted.
   * @default false
   */
  shouldFailOnStart?: boolean;
}

/**
 * Fake implementation of {@link AudioRecorder} for UI development.
 *
 * Simulates hardware audio capture without accessing the browser's
 * MediaDevices API. Can be configured to test permission denied and
 * recording failure scenarios.
 *
 * @example
 * ```typescript
 * const recorder = new FakeAudioRecorder();
 * const perms = await recorder.requestPermissions();
 * await recorder.startRecording();
 * const blob = await recorder.stopRecording();
 * console.log(blob.type); // 'audio/webm'
 * ```
 */
export class FakeAudioRecorder implements AudioRecorder {
  private options: Required<FakeAudioRecorderOptions>;

  /**
   * @param options - Configuration for permission and error simulation.
   */
  constructor(options: FakeAudioRecorderOptions = {}) {
    this.options = {
      grantPermission: options.grantPermission ?? true,
      shouldFailOnStart: options.shouldFailOnStart ?? false,
    };
  }

  /**
   * Simulates a hardware permission request.
   *
   * @returns {@link PermissionsDTO} reflecting the configured permission state.
   */
  async requestPermissions(): Promise<PermissionsDTO> {
    return { microphoneGranted: this.options.grantPermission };
  }

  /**
   * Simulates starting the audio stream capture.
   *
   * If {@link FakeAudioRecorderOptions.shouldFailOnStart} is `true`, rejects
   * with `RECORDING_FAILED`.
   *
   * @throws {RecorderError} With code `RECORDING_FAILED` when simulated failure is enabled.
   * @throws {RecorderError} With code `PERMISSION_DENIED` if permissions were not granted.
   */
  async startRecording(): Promise<void> {
    if (!this.options.grantPermission) {
      throw new RecorderError('PERMISSION_DENIED');
    }

    if (this.options.shouldFailOnStart) {
      throw new RecorderError('RECORDING_FAILED');
    }
  }

  /**
   * Simulates stopping the recording and releasing the microphone.
   *
   * @returns An empty `audio/webm` {@link Blob} to simulate a real audio file.
   */
  async stopRecording(): Promise<Blob> {
    return new Blob([], { type: 'audio/webm' });
  }

  /**
   * Simulates aborting the current recording without saving data.
   */
  cancelRecording(): void {
    // No-op: the mock has no hardware resources to release
  }
}
