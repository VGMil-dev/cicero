import { DomainError } from '../shared/DomainError';
import errors from './errors.json';

export type OratoryAnalysisErrorCode = keyof typeof errors;

/**
 * Error class specific to the OratoryAnalysis domain.
 * Automatically typed and populated from errors.json, supporting custom overrides.
 */
export class OratoryAnalysisError extends DomainError {
  constructor(code: OratoryAnalysisErrorCode, details?: unknown) {
    super(code, errors[code], details);
    this.name = 'OratoryAnalysisError';
  }
}
