import { DefaultCalculateScoreUseCase } from '../core/OratoryAnalysis/CalculateScore.usecase';
import { TranscriptionResultDTO } from '../core/SpeechToText/types';

describe('CalculateScoreUseCase', () => {
  let useCase: DefaultCalculateScoreUseCase;

  beforeEach(() => {
    useCase = new DefaultCalculateScoreUseCase();
  });

  it('should handle empty transcription gracefully', () => {
    const input: TranscriptionResultDTO = {
      text: '',
      chunks: [],
    };

    const result = useCase.execute(input);

    expect(result.metrics.overallScore).toBe(100);
    expect(result.metrics.fillerWordsCount).toBe(0);
    expect(result.metrics.wordsPerMinute).toBe(0);
    expect(result.metrics.fillerWordsBreakdown).toEqual({});
    expect(result.chunks).toEqual([]);
  });

  it('should return score of 100% when there are no filler words', () => {
    const input: TranscriptionResultDTO = {
      text: 'Hola a todos en la sala',
      chunks: [
        { word: 'Hola', start: 0.0, end: 0.5 },
        { word: 'a', start: 0.6, end: 0.7 },
        { word: 'todos', start: 0.8, end: 1.2 },
        { word: 'en', start: 1.3, end: 1.5 },
        { word: 'la', start: 1.6, end: 1.7 },
        { word: 'sala', start: 1.8, end: 2.3 },
      ],
    };

    const result = useCase.execute(input);

    expect(result.metrics.overallScore).toBe(100);
    expect(result.metrics.fillerWordsCount).toBe(0);
    expect(result.metrics.wordsPerMinute).toBe(157); // 6 words / 2.3s * 60 = 156.52 -> 157
    expect(result.metrics.fillerWordsBreakdown).toEqual({});
    expect(result.chunks.every(c => !c.isFillerWord)).toBe(true);
  });

  it('should detect filler words and calculate correct score and breakdown', () => {
    const input: TranscriptionResultDTO = {
      text: 'Hola eh bueno amigos',
      chunks: [
        { word: 'Hola', start: 0.0, end: 0.5 },
        { word: 'eh', start: 0.6, end: 1.0 },
        { word: 'bueno', start: 1.1, end: 1.6 },
        { word: 'amigos', start: 1.7, end: 2.4 },
      ],
    };

    const result = useCase.execute(input);

    // 4 words total, 2 filler words ('eh', 'bueno')
    // Score: (4 - 2) / 4 * 100 = 50%
    expect(result.metrics.overallScore).toBe(50);
    expect(result.metrics.fillerWordsCount).toBe(2);
    expect(result.metrics.wordsPerMinute).toBe(100); // 4 words / 2.4s * 60 = 100
    expect(result.metrics.fillerWordsBreakdown).toEqual({
      eh: 1,
      bueno: 1,
    });

    expect(result.chunks[0].isFillerWord).toBe(false);
    expect(result.chunks[1].isFillerWord).toBe(true);
    expect(result.chunks[2].isFillerWord).toBe(true);
    expect(result.chunks[3].isFillerWord).toBe(false);
  });

  it('should clean punctuation and handle uppercase in filler word matching', () => {
    const input: TranscriptionResultDTO = {
      text: '¡Eh! entonces, mmm...',
      chunks: [
        { word: '¡Eh!', start: 0.0, end: 0.8 },
        { word: 'entonces,', start: 0.9, end: 1.5 },
        { word: 'mmm...', start: 1.6, end: 2.2 },
      ],
    };

    const result = useCase.execute(input);

    // All 3 words are filler words ('eh', 'entonces', 'mmm')
    expect(result.metrics.overallScore).toBe(0);
    expect(result.metrics.fillerWordsCount).toBe(3);
    expect(result.metrics.fillerWordsBreakdown).toEqual({
      eh: 1,
      entonces: 1,
      mmm: 1,
    });

    // Check that original words are preserved in output chunks
    expect(result.chunks[0]).toEqual({ word: '¡Eh!', start: 0.0, end: 0.8, isFillerWord: true });
    expect(result.chunks[1]).toEqual({ word: 'entonces,', start: 0.9, end: 1.5, isFillerWord: true });
    expect(result.chunks[2]).toEqual({ word: 'mmm...', start: 1.6, end: 2.2, isFillerWord: true });
  });

  it('should support custom filler words dictionary', () => {
    const customUseCase = new DefaultCalculateScoreUseCase(new Set(['custom', 'word']));
    const input: TranscriptionResultDTO = {
      text: 'hola custom eh bueno',
      chunks: [
        { word: 'hola', start: 0.0, end: 0.5 },
        { word: 'custom', start: 0.6, end: 1.0 },
        { word: 'eh', start: 1.1, end: 1.5 },
        { word: 'bueno', start: 1.6, end: 2.0 },
      ],
    };

    const result = customUseCase.execute(input);

    // Only 'custom' is considered a filler word now (1 out of 4)
    expect(result.metrics.overallScore).toBe(75);
    expect(result.metrics.fillerWordsCount).toBe(1);
    expect(result.metrics.fillerWordsBreakdown).toEqual({ custom: 1 });
  });
});
