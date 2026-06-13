import { IAudioRecorder } from '../../ports/audio/IAudioRecorder';
import { PermissionsDTO } from '../../ports/audio/types';
import { CaptureError } from '../../ports/audio/CaptureError';

/**
 * Adapter implementing {@link IAudioRecorder} for native audio capture
 * using the browser's MediaRecorder and MediaDevices APIs.
 * 
 * Manages the lifecycle of recording including permission checks, stream
 * acquisition, physical recording orchestration with MediaRecorder, and clean resource disposal.
 * 
 * @example
 * ```typescript
 * const recorder = new BrowserMediaRecorder();
 * const permission = await recorder.requestPermissions();
 * if (permission.microphoneGranted) {
 *   await recorder.startRecording();
 *   // ... record audio ...
 *   const audioBlob = await recorder.stopRecording();
 * }
 * ```
 */
export class BrowserMediaRecorder implements IAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private mimeType: string = '';

  constructor() {
    // Determine the best supported mimeType on instantiation
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/wav'
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        this.mimeType = type;
        break;
      }
    }
  }

  /**
   * Requests necessary hardware permissions (Microphone) from the user.
   * 
   * If permissions are granted, it temporarily acquires and immediately releases
   * the stream tracks to ensure the recording indicator of the operating system is not left active.
   * 
   * @returns A promise resolving to the status of permissions in a {@link PermissionsDTO}.
   */
  async requestPermissions(): Promise<PermissionsDTO> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { microphoneGranted: false };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Clean up the stream immediately to turn off OS microphone indicator
      stream.getTracks().forEach((track) => track.stop());
      return { microphoneGranted: true };
    } catch {
      return { microphoneGranted: false };
    }
  }

  /**
   * Starts the audio stream capture from the microphone.
   * 
   * @throws {CaptureError} With code `RECORDING_FAILED` if recording is already active or API is unsupported.
   * @throws {CaptureError} With code `PERMISSION_DENIED` if microphone permission is denied.
   */
  async startRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new CaptureError(
        'RECORDING_FAILED',
        'Recording is already in progress'
      );
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new CaptureError(
        'RECORDING_FAILED',
        'MediaDevices API is not supported in this browser or context'
      );
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new CaptureError(
        'PERMISSION_DENIED',
        `Microphone access was denied or unavailable: ${message}`,
        error
      );
    }

    try {
      this.chunks = [];
      const options = this.mimeType ? { mimeType: this.mimeType } : undefined;
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      this.cleanupStream();
      const message = error instanceof Error ? error.message : String(error);
      throw new CaptureError(
        'RECORDING_FAILED',
        `Failed to start MediaRecorder: ${message}`,
        error
      );
    }
  }

  /**
   * Stops the current recording and releases the microphone.
   * 
   * @returns A promise resolving to a {@link Blob} containing the captured audio data.
   * @throws {CaptureError} With code `RECORDING_FAILED` if there is no active recording.
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      throw new CaptureError(
        'RECORDING_FAILED',
        'No active recording to stop'
      );
    }

    return new Promise<Blob>((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new CaptureError('RECORDING_FAILED', 'Recorder was disposed before stopping'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const type = this.mimeType || this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.chunks, { type });
          this.cleanup();
          resolve(audioBlob);
        } catch (error) {
          this.cleanup();
          reject(new CaptureError(
            'RECORDING_FAILED',
            'Failed to compile recorded audio data',
            error
          ));
        }
      };

      try {
        this.mediaRecorder.stop();
        this.cleanupStream(); // Release microphone as soon as stop is initiated
      } catch (error) {
        this.cleanup();
        reject(new CaptureError(
          'RECORDING_FAILED',
          'Failed to stop MediaRecorder execution',
          error
        ));
      }
    });
  }

  /**
   * Aborts the current recording process and cleans up resources.
   * No data is saved or returned.
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        // Prevent onstop callback from executing and resolving/rejecting
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
      } catch {
        // Suppress errors during cancel stop
      }
    }
    this.cleanup();
  }

  private cleanupStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  private cleanup(): void {
    this.cleanupStream();
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
