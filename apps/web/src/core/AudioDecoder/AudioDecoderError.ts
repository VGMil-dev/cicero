import { DomainError } from '../shared/DomainError';
import errors from './errors.json';

export type AudioDecoderErrorCode = keyof typeof errors;

/**
 * Error class specific to the AudioDecoder domain.
 * Automatically typed and populated from errors.json, supporting custom overrides.
 */
export class AudioDecoderError extends DomainError {
  constructor(code: AudioDecoderErrorCode, details?: unknown) {
    super(code, errors[code], details);
    this.name = 'AudioDecoderError';
  }
}
