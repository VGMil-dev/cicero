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
 * Result of the hardware permission request.
 */
export interface PermissionsDTO {
  /** Whether the microphone access was granted by the user */
  microphoneGranted: boolean;
}

/**
 * Standard error codes for the capture slice.
 * 
 * - `PERMISSION_DENIED`: Microphone access was rejected by the user.
 * - `MODEL_LOAD_FAILED`: Model files could not be downloaded or prepared.
 * - `RECORDING_FAILED`: Hardware capture failed during recording.
 * - `DECODING_FAILED`: Audio decoding failed.
 * - `ANALYSIS_FAILED`: Audio transcription/inference failed.
 * - `WASM_PANIC`: A fatal error or panic occurred within the WASM execution context.
 * - `UNKNOWN`: Unrecognized or unclassified error.
 */
export type ErrorCode =
  | 'PERMISSION_DENIED'
  | 'MODEL_LOAD_FAILED'
  | 'RECORDING_FAILED'
  | 'DECODING_FAILED'
  | 'ANALYSIS_FAILED'
  | 'WASM_PANIC'
  | 'UNKNOWN';

/**
 * Data Transfer Object for error reporting in the audio flow.
 * Preserves the stack trace (e.g., WASM panics, runtime stack) to aid debugging.
 * 
 * @example
 * ```typescript
 * const error: ErrorDTO = {
 *   code: 'WASM_PANIC',
 *   message: 'unreachable executed',
 *   stack: 'wasm-function[302]:0x1a2b\nwasm-function[102]:0x3c4d'
 * };
 * ```
 */
export interface ErrorDTO {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional technical details or structured payloads */
  details?: unknown;
  /** Preserved stack trace from JS or WASM to facilitate debugging */
  stack?: string;
}
