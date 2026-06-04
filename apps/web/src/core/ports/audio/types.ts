export type AudioCaptureState = 'idle' | 'loading-model' | 'ready' | 'recording' | 'error';

export interface ProgressDTO {
  progress: number; // Percentage from 0 to 100
  stage: string; // e.g., 'downloading', 'extracting', 'loading'
  estimatedTimeRemaining?: number; // In milliseconds
}

export interface PermissionsDTO {
  microphoneGranted: boolean;
}

export type ErrorCode = 'PERMISSION_DENIED' | 'MODEL_LOAD_FAILED' | 'RECORDING_FAILED' | 'UNKNOWN';

export interface ErrorDTO {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
