import { ErrorDTO } from './types';

/**
 * Base class for all domain-specific errors.
 * Preserves the stack trace and wraps an {@link ErrorDTO} for UI consumption.
 */
export class DomainError extends Error {
  /** Structured error data for UI consumption. */
  public readonly dto: ErrorDTO;

  /**
   * @param code - Machine-readable error code.
   * @param message - Human-readable error message.
   * @param details - Optional technical details.
   */
  constructor(code: string, message: string, details?: unknown) {
    super(`[${code}] ${message}`);
    this.name = 'DomainError';
    this.dto = { code, message, details };
  }
}
