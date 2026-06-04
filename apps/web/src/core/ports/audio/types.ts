/**
 * Possible states for the audio capture and model initialization flow.
 * 
 * - `idle`: Initial state. The system is ready but hasn't started loading the model.
 * - `loading-model`: The AI model is being downloaded or initialized in the Worker.
 * - `ready`: Model is loaded and hardware permissions are granted. Ready to record.
 * - `recording`: Audio capture is currently in progress.
 * - `error`: A failure occurred in the flow (permissions, network, or processing).
 */
export type AudioCaptureState = 'idle' | 'loading-model' | 'ready' | 'recording' | 'error';

/**
 * Data Transfer Object representing the loading progress of the AI model.
 */
export interface ProgressDTO {
  /** Percentage of completion from 0 to 100 */
  progress: number;
  /** Current stage description (e.g., 'downloading', 'extracting', 'loading') */
  stage: string;
  /** Estimated time to completion in milliseconds, if available */
  estimatedTimeRemaining?: number;
}

/**
 * Result of the hardware permission request.
 */
export interface PermissionsDTO {
  /** Whether the microphone access was granted by the user */
  microphoneGranted: boolean;
}

/**
 * Standard error codes for the capture slice.
 */
export type ErrorCode = 'PERMISSION_DENIED' | 'MODEL_LOAD_FAILED' | 'RECORDING_FAILED' | 'UNKNOWN';

/**
 * Data Transfer Object for error reporting in the audio flow.
 */
export interface ErrorDTO {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional technical details or stack traces */
  details?: unknown;
}
