import { CalculateScoreUseCase, ScoreResult } from './CalculateScore.port';
import { TranscriptionResultDTO } from '../SpeechToText/types';
import { AudioChunkDTO } from './types';

/**
 * Default dictionary of filler words (muletillas) in Spanish.
 */
const DEFAULT_FILLER_WORDS = new Set([
  'eh',
  'eee',
  'mmm',
  'este',
  'bueno',
  'digamos',
  'tipo',
  'nada',
  'entonces',
  'como',
]);

/**
 * Concrete implementation of the {@link CalculateScoreUseCase} port.
 * Analyzes a speech transcription to identify filler words and calculate speech metrics (WPM, score).
 *
 * @example
 * ```typescript
 * const useCase = new DefaultCalculateScoreUseCase();
 * const result = useCase.execute({
 *   text: "Hola, eh, bueno...",
 *   chunks: [
 *     { word: "Hola,", start: 0.0, end: 0.5 },
 *     { word: "eh,", start: 0.6, end: 1.0 },
 *     { word: "bueno...", start: 1.1, end: 1.8 }
 *   ]
 * });
 * ```
 */
export class DefaultCalculateScoreUseCase implements CalculateScoreUseCase {
  private fillerWords: Set<string>;

  /**
   * @param fillerWords - Optional custom set of filler words in lowercase. Defaults to {@link DEFAULT_FILLER_WORDS}.
   */
  constructor(fillerWords: Set<string> = DEFAULT_FILLER_WORDS) {
    this.fillerWords = fillerWords;
  }

  /**
   * Evaluates the transcription and returns the calculated score and metrics.
   * Cleans punctuation and normalizes casing to detect filler words.
   *
   * @param transcription - The raw transcription result, {@link TranscriptionResultDTO}.
   * @returns The evaluated {@link ScoreResult} containing metrics and annotated chunks.
   */
  execute(transcription: TranscriptionResultDTO): ScoreResult {
    const rawChunks = transcription.chunks || [];
    const totalWords = rawChunks.length;

    if (totalWords === 0) {
      return {
        metrics: {
          overallScore: 100,
          fillerWordsCount: 0,
          wordsPerMinute: 0,
          fillerWordsBreakdown: {},
        },
        chunks: [],
      };
    }

    let fillerWordsCount = 0;
    const fillerWordsBreakdown: Record<string, number> = {};

    const chunks: AudioChunkDTO[] = rawChunks.map((chunk) => {
      // Clean punctuation and convert to lowercase
      const cleanWord = chunk.word
        .toLowerCase()
        .replace(/[.,;:¡!¿?()\[\]{}*'"\-]/g, '');

      const isFiller = this.fillerWords.has(cleanWord);

      if (isFiller) {
        fillerWordsCount++;
        fillerWordsBreakdown[cleanWord] = (fillerWordsBreakdown[cleanWord] || 0) + 1;
      }

      return {
        word: chunk.word,
        start: chunk.start,
        end: chunk.end,
        isFillerWord: isFiller,
      };
    });

    const overallScore = Math.round(((totalWords - fillerWordsCount) / totalWords) * 100);

    // WPM calculation: last chunk's end time is the duration in seconds
    const durationSeconds = rawChunks[totalWords - 1].end;
    const wordsPerMinute = durationSeconds > 0
      ? Math.round((totalWords / durationSeconds) * 60)
      : 0;

    return {
      metrics: {
        overallScore,
        fillerWordsCount,
        wordsPerMinute,
        fillerWordsBreakdown,
      },
      chunks,
    };
  }
}
