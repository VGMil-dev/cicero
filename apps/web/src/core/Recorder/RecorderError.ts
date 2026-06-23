import { DomainError } from '../shared/DomainError';
import errors from './errors.json';

export type RecorderErrorCode = keyof typeof errors;

/**
 * Error class specific to the Recorder domain.
 * Automatically typed and populated from errors.json, supporting custom overrides.
 */
export class RecorderError extends DomainError {
  constructor(code: RecorderErrorCode, details?: unknown) {
    super(code, errors[code], details);
    this.name = 'RecorderError';
  }
}
