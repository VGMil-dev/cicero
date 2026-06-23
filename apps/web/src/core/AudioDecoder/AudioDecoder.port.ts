/**
 * Interface for the secondary port (Driven) responsible for decoding audio.
 * Converts various audio binary formats (Blob) into standard mono PCM at 16kHz,
 * which is the format expected by the speech-to-text models.
 * 
 * @example
 * ```typescript
 * const decoder: AudioDecoder = new WebAudioDecoder();
 * const audioPCM = await decoder.decodeTo16kHzMono(audioBlob);
 * ```
 */
export interface AudioDecoder {
  /**
   * Decodes an audio blob to a single-channel (mono) Float32Array sampled at 16kHz.
   * 
   * @param audioBlob - The source audio {@link Blob} captured from recording or file upload.
   * @returns A promise resolving to a {@link Float32Array} containing the 16kHz PCM audio data.
   * @throws {CaptureError} If decoding fails due to corrupt audio format or unsupported codecs.
   */
  decodeTo16kHzMono(audioBlob: Blob): Promise<Float32Array>;
}
