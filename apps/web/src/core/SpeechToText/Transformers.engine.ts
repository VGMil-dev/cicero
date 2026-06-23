import { pipeline } from '@huggingface/transformers';
import { TranscriptionResultDTO, RawAudioChunk } from './types';

/**
 * Progress updates shape emitted by Transformers.js shards downloader.
 */
export interface TransformersProgressData {
  status: string;
  progress?: number;
  file?: string;
}

/**
 * Shape of individual token/word chunks returned by Transformers.js ASR pipeline.
 */
interface WhisperPipelineChunk {
  text: string;
  timestamp: [number, number];
}

/**
 * Speech-to-text inference engine using Hugging Face's Transformers.js library.
 * Encapsulates the initialization, loading, and inference of the speech-to-text ONNX model.
 * 
 * @example
 * ```typescript
 * const engine = new TransformersEngine();
 * await engine.initialize('onnx-community/CrisperWhisper-ONNX', { device: 'webgpu', dtype: 'q8' });
 * const result = await engine.infer(audioPCM);
 * console.log('Transcription text:', result.text);
 * ```
 */
export class TransformersEngine {
  private pipelineInstance: unknown = null;

  /**
   * Initializes the pipeline using Transformers.js with specific model, device, and precision.
   * 
   * @param modelName - The model identifier to load (e.g. 'onnx-community/CrisperWhisper-ONNX').
   * @param options - Configuration options for device target, quantization, and progress monitoring.
   * @returns A promise that resolves when the model is loaded.
   */
  async initialize(
    modelName: string,
    options: {
      device: 'webgpu' | 'wasm';
      dtype: 'q4' | 'q8' | 'fp32';
      progress_callback?: (data: TransformersProgressData) => void;
    }
  ): Promise<void> {
    this.pipelineInstance = await pipeline('automatic-speech-recognition', modelName, {
      device: options.device,
      dtype: options.dtype,
      progress_callback: options.progress_callback,
    });
  }

  /**
   * Performs automatic speech recognition (ASR) inference on raw 16kHz mono PCM audio data.
   * Extracts transcription text and word-level timestamps.
   * 
   * @param audioData - Raw 16kHz mono PCM audio data as a {@link Float32Array}.
   * @returns A promise resolving to the {@link TranscriptionResultDTO}.
   * @throws {Error} If the engine is not initialized or inference execution fails.
   */
  async infer(audioData: Float32Array): Promise<TranscriptionResultDTO> {
    if (!this.pipelineInstance) {
      throw new Error('TransformersEngine is not initialized. Call initialize() first.');
    }

    try {
      const pipelineFn = this.pipelineInstance as (
        audio: Float32Array,
        options: {
          chunk_length_s: number;
          stride_length_s: number;
          return_timestamps: boolean | string;
          language?: string;
          task?: string;
        }
      ) => Promise<unknown>;

      let response: unknown;
      // El modelo ONNX de CrisperWhisper no soporta timestamps por palabra directamente
      // (falta cross-attention en el grafo exportado). Usamos directamente nivel de segmento e interpolamos.
      const useSegmentInterpolation = true;

      try {
        response = await pipelineFn(audioData, {
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: true,
          language: 'spanish',
          task: 'transcribe',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Inference execution failed: ${message}`);
      }

      const output = (Array.isArray(response) ? response[0] : response) as {
        text: string;
        chunks?: { text: string; timestamp: [number, number] | null }[];
      };

      if (!output || typeof output.text !== 'string') {
        throw new Error('Invalid pipeline response format: missing text field');
      }

      const text: string = output.text;
      const rawChunks = output.chunks || [];
      const chunks: RawAudioChunk[] = [];

      if (useSegmentInterpolation) {
        // Interpolar las palabras dentro de cada segmento
        for (const segment of rawChunks) {
          const segmentText = segment.text || '';
          const words = segmentText.trim().split(/\s+/).filter(Boolean);
          if (words.length === 0) continue;

          // Si el segmento no tiene timestamps válidos, aproximamos sobre la duración total
          const start = (segment.timestamp && typeof segment.timestamp[0] === 'number') ? segment.timestamp[0] : 0;
          const end = (segment.timestamp && typeof segment.timestamp[1] === 'number') ? segment.timestamp[1] : start + 2;
          
          const duration = end - start;
          const wordDuration = duration / words.length;

          for (let i = 0; i < words.length; i++) {
            chunks.push({
              word: words[i],
              start: start + i * wordDuration,
              end: start + (i + 1) * wordDuration,
            });
          }
        }
      } else {
        // Procesar la respuesta word-level original
        for (const chunk of rawChunks) {
          const word = typeof chunk.text === 'string' ? chunk.text : '';
          const start = Array.isArray(chunk.timestamp) && typeof chunk.timestamp[0] === 'number'
            ? chunk.timestamp[0]
            : 0;
          const end = Array.isArray(chunk.timestamp) && typeof chunk.timestamp[1] === 'number'
            ? chunk.timestamp[1]
            : start;
          chunks.push({
            word,
            start,
            end,
          });
        }
      }

      return {
        text,
        chunks,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Inference execution failed: ${message}`);
    }
  }
}
