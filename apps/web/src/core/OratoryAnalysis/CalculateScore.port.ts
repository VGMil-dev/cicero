import { TranscriptionResultDTO } from '../SpeechToText/types';
import { SessionMetricsDTO, AudioChunkDTO } from './types';

/**
 * Result of the speech evaluation containing fluency metrics and annotated chunks.
 * 
 * @example
 * ```typescript
 * const scoreResult: ScoreResult = {
 *   metrics: {
 *     overallScore: 85,
 *     fillerWordsCount: 2,
 *     wordsPerMinute: 120,
 *     fillerWordsBreakdown: { 'eh': 2 }
 *   },
 *   chunks: [
 *     { word: 'hola', start: 0.1, end: 0.5, isFillerWord: false },
 *     { word: 'eh', start: 0.6, end: 0.9, isFillerWord: true }
 *   ]
 * };
 * ```
 */
export interface ScoreResult {
  /** Calculated fluency and speech metrics, {@link SessionMetricsDTO} */
  metrics: SessionMetricsDTO;
  /** The transcribed words annotated with filler word classification, {@link AudioChunkDTO} */
  chunks: AudioChunkDTO[];
}

/**
 * Interface for the primary port (Driver/Domain) representing the calculate score use case.
 * Evaluates a transcription to identify filler words and calculate speech metrics (WPM, score).
 * 
 * @example
 * ```typescript
 * const useCase: CalculateScoreUseCase = new DefaultCalculateScoreUseCase();
 * const score = useCase.execute(transcriptionResult);
 * console.log('Fluency Score:', score.metrics.overallScore);
 * ```
 */
export interface CalculateScoreUseCase {
  /**
   * Evaluates the transcription and returns the calculated score and metrics.
   * 
   * @param transcription - The raw transcription result, {@link TranscriptionResultDTO}.
   * @returns The evaluated {@link ScoreResult} containing metrics and annotated chunks.
   */
  execute(transcription: TranscriptionResultDTO): ScoreResult;
}
