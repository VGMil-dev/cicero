import { IAudioDecoder } from '../../ports/audio/IAudioDecoder';
import { CaptureError } from '../../ports/audio/CaptureError';

/**
 * Adapter implementing {@link IAudioDecoder} for browser-based audio decoding and resampling.
 * 
 * Uses the Web Audio API's {@link OfflineAudioContext} to resample and downmix any source audio Blob
 * to a standard mono Float32Array sampled at 16kHz.
 * 
 * @example
 * ```typescript
 * const decoder = new BrowserAudioDecoder();
 * const pcmData = await decoder.decodeTo16kHzMono(audioBlob);
 * ```
 */
export class BrowserAudioDecoder implements IAudioDecoder {
  private readonly OfflineAudioContextClass: typeof OfflineAudioContext | null;

  /**
   * @param OfflineAudioContextClass - The constructor for OfflineAudioContext (allows injecting mocks for testing).
   */
  constructor(
    OfflineAudioContextClass: typeof OfflineAudioContext | null = (
      typeof globalThis !== 'undefined'
        ? (globalThis.OfflineAudioContext || (globalThis as any).webkitOfflineAudioContext)
        : null
    )
  ) {
    this.OfflineAudioContextClass = OfflineAudioContextClass;
  }

  /**
   * Decodes an audio blob to a single-channel (mono) Float32Array sampled at 16kHz.
   * 
   * @param audioBlob - The source audio {@link Blob}.
   * @returns A promise resolving to a {@link Float32Array} containing the 16kHz PCM audio data.
   * @throws {CaptureError} With code `DECODING_FAILED` if the decoding or resampling fails.
   */
  async decodeTo16kHzMono(audioBlob: Blob): Promise<Float32Array> {
    if (!this.OfflineAudioContextClass) {
      throw new CaptureError(
        'DECODING_FAILED',
        'Web Audio API (OfflineAudioContext) is not supported in this environment'
      );
    }

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await audioBlob.arrayBuffer();
    } catch (error) {
      throw new CaptureError(
        'DECODING_FAILED',
        'Failed to read audio blob content',
        error
      );
    }

    let audioBuffer: AudioBuffer;
    try {
      // Create a temporary, minimal OfflineAudioContext to call decodeAudioData.
      // This avoids initializing actual audio hardware or facing autoplay/permission restrictions.
      const tempContext = new this.OfflineAudioContextClass(1, 1, 16000);
      audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new CaptureError(
        'DECODING_FAILED',
        'Failed to decode audio binary data',
        error
      );
    }

    // Optimization: If the decoded buffer is already 16kHz and Mono, we can directly return the channel data
    if (audioBuffer.sampleRate === 16000 && audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    }

    try {
      const targetSampleRate = 16000;
      const targetChannels = 1;
      const targetLength = Math.round(audioBuffer.duration * targetSampleRate);

      // Create the offline context for resampling and mixing down to mono
      const offlineContext = new this.OfflineAudioContextClass(
        targetChannels,
        targetLength,
        targetSampleRate
      );

      // Create a buffer source node
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      // Connect source to context destination (mono mixdown happens automatically)
      source.connect(offlineContext.destination);
      source.start(0);

      // Render the audio graph
      const renderedBuffer = await offlineContext.startRendering();
      return renderedBuffer.getChannelData(0);
    } catch (error) {
      throw new CaptureError(
        'DECODING_FAILED',
        'Failed to resample audio data to 16kHz mono',
        error
      );
    }
  }
}
