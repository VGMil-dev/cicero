import { TranscriptionResultDTO } from './types';

/**
 * Interface for the secondary port (Driven) responsible for audio analysis and speech-to-text.
 * Performs automatic speech recognition (ASR) to extract transcription and word-level timestamps.
 * 
 * @example
 * ```typescript
 * const analyzer: IAudioAnalyzer = new WorkerAudioAnalyzer(bootstrap);
 * const result = await analyzer.analyzeAudio(audioPCM);
 * console.log('Transcribed text:', result.text);
 * ```
 */
export interface IAudioAnalyzer {
  /**
   * Analyzes raw 16kHz mono PCM audio data and returns the transcription result.
   * 
   * @param audioPCM - The raw audio data as a {@link Float32Array}.
   * @returns A promise resolving to the {@link TranscriptionResultDTO}.
   * @throws {CaptureError} If the AI model is not initialized, worker is terminated, or inference fails.
   */
  analyzeAudio(audioPCM: Float32Array): Promise<TranscriptionResultDTO>;
}
