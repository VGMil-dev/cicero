import { SpeechAnalyzer } from './SpeechAnalyzer.port';
import { ModelBootstrap } from './ModelBootstrap.port';
import { AudioDecoder } from '../AudioDecoder/AudioDecoder.port';
import { CaptureError } from '../shared/CaptureError';
import { TranscriptionResultDTO, WorkerMessageDTO } from '../shared/types';

/**
 * Secondary adapter (Driven) that orchestrates audio speech-to-text analysis.
 * Uses a background Web Worker running Transformers.js to perform inference.
 * Optionally integrates with an {@link AudioDecoder} to process Blob inputs.
 * 
 * @example
 * ```typescript
 * const bootstrap = new WorkerModelBootstrap();
 * await bootstrap.initialize();
 * const decoder = new BrowserAudioDecoder();
 * const adapter = new TransformersSpeechAnalyzer(bootstrap, decoder);
 * 
 * // Transcribe Float32Array PCM data
 * const result = await adapter.analyzeAudio(audioPCM);
 * console.log('Transcription text:', result.text);
 * ```
 */
export class TransformersSpeechAnalyzer implements SpeechAnalyzer {
  private readonly bootstrap: ModelBootstrap;
  private readonly decoder?: AudioDecoder;

  /**
   * Creates an instance of TransformersSpeechAnalyzer.
   * 
   * @param bootstrap - The service responsible for preparing the Web Worker environment.
   * @param decoder - Optional audio decoder to decode Blobs before inference.
   */
  constructor(bootstrap: ModelBootstrap, decoder?: AudioDecoder) {
    if (!bootstrap) {
      throw new Error('Audio model bootstrap instance is required.');
    }
    this.bootstrap = bootstrap;
    this.decoder = decoder;
  }

  /**
   * Analyzes raw audio data and returns the speech-to-text transcription result.
   * Supports both Float32Array PCM buffer and raw audio Blobs.
   * Zero-copy transfer is used for performance when posting to the Web Worker.
   * 
   * @param audioData - Raw 16kHz mono PCM data as {@link Float32Array} or audio {@link Blob}.
   * @returns A promise resolving to the {@link TranscriptionResultDTO}.
   * @throws {CaptureError} If model/worker is not ready, decoding fails, or inference fails.
   */
  async analyzeAudio(audioData: Float32Array | Blob): Promise<TranscriptionResultDTO> {
    // 1. Verify that the model/worker is ready
    if (this.bootstrap.getState() !== 'ready') {
      throw new CaptureError(
        'ANALYSIS_FAILED',
        'AI model is not initialized or ready. Ensure bootstrap.initialize() is resolved first.'
      );
    }

    // 2. Decode the audio Blob to 16kHz mono PCM if a Blob is provided
    let pcm: Float32Array;
    if (audioData instanceof Blob) {
      if (!this.decoder) {
        throw new CaptureError(
          'DECODING_FAILED',
          'Audio decoding requires an AudioDecoder instance, but none was provided.'
        );
      }
      pcm = await this.decoder.decodeTo16kHzMono(audioData);
    } else {
      pcm = audioData;
    }

    // 3. Coordinate with the Web Worker to execute inference
    return new Promise<TranscriptionResultDTO>((resolve, reject) => {
      const worker = this.bootstrap.getWorkerInstance?.() || null;
      if (!worker) {
        return reject(
          new CaptureError(
            'ANALYSIS_FAILED',
            'Web Worker is not active or has been unexpectedly terminated.'
          )
        );
      }

      // Handle message events back from the worker
      const handleWorkerMessage = (event: MessageEvent<WorkerMessageDTO>) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'ANALYSIS_SUCCESS') {
          cleanup();
          resolve(msg.payload);
        } else if (msg.type === 'ERROR') {
          cleanup();
          reject(
            new CaptureError(
              msg.payload.code,
              msg.payload.message,
              msg.payload.details
            )
          );
        }
      };

      // Handle fatal worker/WASM crashes
      const handleWorkerError = (errorEvent: ErrorEvent) => {
        cleanup();
        reject(
          new CaptureError(
            'WASM_PANIC',
            `Critical execution error inside Web Worker: ${errorEvent.message || 'Unknown panic'}`
          )
        );
      };

      // Unsubscribe listeners from the worker
      const cleanup = () => {
        worker.removeEventListener('message', handleWorkerMessage);
        worker.removeEventListener('error', handleWorkerError);
      };

      worker.addEventListener('message', handleWorkerMessage);
      worker.addEventListener('error', handleWorkerError);

      try {
        // Execute inference using Zero-Copy transfer for optimal performance
        worker.postMessage(
          {
            type: 'ANALYZE_AUDIO',
            payload: pcm,
          },
          [pcm.buffer]
        );
      } catch (err: unknown) {
        cleanup();
        const msg = err instanceof Error ? err.message : String(err);
        reject(
          new CaptureError(
            'ANALYSIS_FAILED',
            `Failed to transfer audio buffer to Web Worker: ${msg}`,
            err
          )
        );
      }
    });
  }
}
