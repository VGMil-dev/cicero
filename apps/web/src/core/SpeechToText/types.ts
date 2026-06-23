import { ErrorDTO } from '../shared/types';

/**
 * Detailed stages and statuses for the model loading/initialization progress.
 * 
 * - `downloading`: The model weights/files are being downloaded from the network.
 * - `extracting`: Files are being extracted/uncompressed.
 * - `loading`: The model is being loaded into memory/WASM execution context.
 * - `ready`: Model is fully loaded and confirmed.
 * - `panic`: A fatal execution error or WASM panic occurred.
 */
export type ProgressStatus = 'downloading' | 'extracting' | 'loading' | 'ready' | 'panic';

/**
 * Data Transfer Object representing the loading progress of the AI model.
 * Structured to report detailed model initialization stages, panics, and confirmation.
 * 
 * @example
 * ```typescript
 * const progress: ProgressDTO = {
 *   status: 'downloading',
 *   progress: 45,
 *   stage: 'downloading model weights',
 *   estimatedTimeRemaining: 12000
 * };
 * ```
 */
export interface ProgressDTO {
  /** The high-level status of the initialization flow, {@link ProgressStatus} */
  status: ProgressStatus;
  /** Percentage of completion from 0 to 100 */
  progress: number;
  /** Current detailed stage description (e.g., 'fetching shards', 'compiling WASM') */
  stage: string;
  /** Estimated time to completion in milliseconds, if available */
  estimatedTimeRemaining?: number;
  /** Detailed message about the current status */
  message?: string;
  /** Error information if status is 'panic', {@link ErrorDTO} */
  error?: ErrorDTO;
}

/**
 * Discriminated union of messages sent from the Main Thread to the Web Worker.
 */
export type MainThreadMessageDTO =
  | {
      /** Action to start the model download and loading process */
      type: 'LOAD_MODEL';
      /** Optional settings to specify model name or quantization */
      payload?: {
        /** The model identifier to load (e.g. 'onnx-community/CrisperWhisper-ONNX') */
        modelName?: string;
        /** Flag to enforce quantized precision (e.g. q8/q4) to prevent out of memory issues */
        quantized?: boolean;
      };
    }
  | {
      /** Action to terminate the Web Worker and release its resources */
      type: 'TERMINATE';
      /** No payload required for termination */
      payload?: null;
    }
  | {
      /** Action to start the audio analysis / inference process */
      type: 'ANALYZE_AUDIO';
      /** The raw PCM audio data (mono, 16kHz) to analyze */
      payload: Float32Array;
    };

/**
 * Discriminated union of messages sent from the Web Worker to the Main Thread.
 */
export type WorkerMessageDTO =
  | {
      /** Indicates a progress update during model initialization */
      type: 'PROGRESS';
      /** The detailed progress payload, {@link ProgressDTO} */
      payload: ProgressDTO;
    }
  | {
      /** Indicates that the model is loaded successfully and ready for use */
      type: 'READY';
      /** No payload required for confirmation */
      payload?: null;
    }
  | {
      /** Indicates that a loading failure or runtime WASM panic occurred */
      type: 'ERROR';
      /** The detailed error payload, {@link ErrorDTO} */
      payload: ErrorDTO;
    }
  | {
      /** Indicates that the audio analysis has finished successfully */
      type: 'ANALYSIS_SUCCESS';
      /** The resulting transcription data, {@link TranscriptionResultDTO} */
      payload: TranscriptionResultDTO;
    };

/**
 * Data Transfer Object representing a raw audio chunk with timing metadata
 * generated during audio transcription. Unlike {@link AudioChunkDTO}, it does not contain
 * information about whether the word is a filler word.
 */
export interface RawAudioChunk {
  /** The transcribed word or token */
  word: string;
  /** Start time of the word in seconds from the beginning of the audio */
  start: number;
  /** End time of the word in seconds from the beginning of the audio */
  end: number;
}

/**
 * Data Transfer Object representing the raw transcription result before fluency analysis.
 */
export interface TranscriptionResultDTO {
  /** The complete transcribed text */
  text: string;
  /** The list of raw word-level timestamps, {@link RawAudioChunk} */
  chunks: RawAudioChunk[];
}
