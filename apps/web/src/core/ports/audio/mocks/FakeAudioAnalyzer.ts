import { IAudioAnalyzer } from '../IAudioAnalyzer';
import { TranscriptionResultDTO } from '../types';

/**
 * Configuration options for {@link FakeAudioAnalyzer}.
 */
export interface FakeAudioAnalyzerOptions {
  /**
   * The simulated processing delay in milliseconds.
   * @default 1500
   */
  delayMs?: number;
  /**
   * Custom transcription result to return.
   * If not provided, a default transcript containing filler words is used.
   */
  customResult?: TranscriptionResultDTO;
}

/**
 * Default simulated transcription result containing Spanish filler words ("este...", "eh...").
 */
const DEFAULT_RESULT: TranscriptionResultDTO = {
  text: 'Hola a todos, este... hoy quería hablar eh... sobre el diseño brutalista.',
  chunks: [
    { word: 'Hola', start: 0.1, end: 0.5 },
    { word: 'a', start: 0.6, end: 0.7 },
    { word: 'todos,', start: 0.8, end: 1.2 },
    { word: 'este...', start: 1.3, end: 1.8 },
    { word: 'hoy', start: 1.9, end: 2.2 },
    { word: 'quería', start: 2.3, end: 2.7 },
    { word: 'hablar', start: 2.8, end: 3.2 },
    { word: 'eh...', start: 3.3, end: 3.8 },
    { word: 'sobre', start: 3.9, end: 4.2 },
    { word: 'el', start: 4.3, end: 4.4 },
    { word: 'diseño', start: 4.5, end: 4.9 },
    { word: 'brutalista.', start: 5.0, end: 5.8 },
  ],
};

/**
 * Fake implementation of {@link IAudioAnalyzer} for testing and UI prototyping.
 *
 * Simulates the Speech-to-Text inference stage with a configurable async delay.
 * Replaces real neural network processing with mock output.
 *
 * @example
 * ```typescript
 * const analyzer = new FakeAudioAnalyzer({ delayMs: 1000 });
 * const result = await analyzer.analyzeAudio(new Float32Array(16000));
 * console.log('Transcribed Text:', result.text);
 * ```
 */
export class FakeAudioAnalyzer implements IAudioAnalyzer {
  private options: Required<FakeAudioAnalyzerOptions>;

  /**
   * @param options - Configuration for simulated delay and mock results.
   */
  constructor(options: FakeAudioAnalyzerOptions = {}) {
    this.options = {
      delayMs: options.delayMs ?? 1500,
      customResult: options.customResult ?? DEFAULT_RESULT,
    };
  }

  /**
   * Simulates analyzing raw audio PCM.
   *
   * @param _audioPCM - Ignored in the mock implementation.
   * @returns A promise resolving to the configured {@link TranscriptionResultDTO}.
   */
  async analyzeAudio(_audioPCM: Float32Array): Promise<TranscriptionResultDTO> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.options.customResult);
      }, this.options.delayMs);
    });
  }
}
