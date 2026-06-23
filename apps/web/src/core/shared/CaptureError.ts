import { ErrorCode, ErrorDTO } from './types';

/**
 * Error thrown by audio capture and processing operations.
 * Wraps an {@link ErrorDTO} in a native {@link Error} to preserve stack traces.
 */
export class CaptureError extends Error {
  /** Structured error data for UI consumption. */
  public readonly dto: ErrorDTO;

  /**
   * @param code - Machine-readable error code.
   * @param message - Human-readable error message.
   * @param details - Optional technical details.
   */
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(`[${code}] ${message}`);
    this.name = 'CaptureError';
    this.dto = { code, message, details };
  }
}
