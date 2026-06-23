import { DomainError } from '../shared/DomainError';
import errors from './errors.json';

export type SpeechToTextErrorCode = keyof typeof errors;

/**
 * Error class specific to the SpeechToText domain.
 * Automatically typed and populated from errors.json, supporting custom overrides.
 */
export class SpeechToTextError extends DomainError {
  constructor(code: SpeechToTextErrorCode, details?: unknown) {
    super(code, errors[code], details);
    this.name = 'SpeechToTextError';
  }
}
