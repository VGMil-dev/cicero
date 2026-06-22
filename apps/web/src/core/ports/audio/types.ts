/**
 * Possible states for the audio capture and model initialization flow.
 * 
 * - `idle`: Initial state. The system is ready but hasn't started loading the model.
 * - `loading-model`: The AI model is being downloaded or initialized in the Worker.
 * - `ready`: Model is loaded and hardware permissions are granted. Ready to record.
 * - `recording`: Audio capture is currently in progress.
 * - `error`: A failure occurred in the flow (permissions, network, or processing).
 */
export type AudioCaptureState = 'idle' | 'loading-model' | 'ready' | 'recording' | 'error';

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
 * Result of the hardware permission request.
 */
export interface PermissionsDTO {
  /** Whether the microphone access was granted by the user */
  microphoneGranted: boolean;
}

/**
 * Standard error codes for the capture slice.
 * 
 * - `PERMISSION_DENIED`: Microphone access was rejected by the user.
 * - `MODEL_LOAD_FAILED`: Model files could not be downloaded or prepared.
 * - `RECORDING_FAILED`: Hardware capture failed during recording.
 * - `DECODING_FAILED`: Audio decoding failed.
 * - `ANALYSIS_FAILED`: Audio transcription/inference failed.
 * - `WASM_PANIC`: A fatal error or panic occurred within the WASM execution context.
 * - `UNKNOWN`: Unrecognized or unclassified error.
 */
export type ErrorCode =
  | 'PERMISSION_DENIED'
  | 'MODEL_LOAD_FAILED'
  | 'RECORDING_FAILED'
  | 'DECODING_FAILED'
  | 'ANALYSIS_FAILED'
  | 'WASM_PANIC'
  | 'UNKNOWN';

/**
 * Data Transfer Object for error reporting in the audio flow.
 * Preserves the stack trace (e.g., WASM panics, runtime stack) to aid debugging.
 * 
 * @example
 * ```typescript
 * const error: ErrorDTO = {
 *   code: 'WASM_PANIC',
 *   message: 'unreachable executed',
 *   stack: 'wasm-function[302]:0x1a2b\nwasm-function[102]:0x3c4d'
 * };
 * ```
 */
export interface ErrorDTO {
  /** Machine-readable error code, {@link ErrorCode} */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional technical details or structured payloads */
  details?: unknown;
  /** Preserved stack trace from JS or WASM to facilitate debugging */
  stack?: string;
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

/**
 * Data Transfer Object representing a single word chunk with timing metadata
 * generated during audio transcription.
 * 
 * @example
 * ```typescript
 * const chunk: AudioChunkDTO = {
 *   word: 'bueno',
 *   start: 1.25,
 *   end: 1.80,
 *   isFillerWord: true
 * };
 * ```
 */
export interface AudioChunkDTO {
  /** The transcribed word or token */
  word: string;
  /** Start time of the word in seconds from the beginning of the audio */
  start: number;
  /** End time of the word in seconds from the beginning of the audio */
  end: number;
  /** Whether the word was classified as a filler word (muletilla) by the evaluation logic */
  isFillerWord: boolean;
}

/**
 * Data Transfer Object containing calculated fluency metrics and score breakdown
 * for an audio session.
 * 
 * @example
 * ```typescript
 * const metrics: SessionMetricsDTO = {
 *   overallScore: 85,
 *   fillerWordsCount: 4,
 *   wordsPerMinute: 110,
 *   fillerWordsBreakdown: { 'eh': 3, 'bueno': 1 }
 * };
 * ```
 */
export interface SessionMetricsDTO {
  /** Overall fluency score from 0 to 100 */
  overallScore: number;
  /** Total count of filler words detected in the session */
  fillerWordsCount: number;
  /** Average words spoken per minute */
  wordsPerMinute: number;
  /** Breakdown of filler word occurrences, mapped by the word to its frequency count */
  fillerWordsBreakdown: Record<string, number>;
}

/**
 * Data Transfer Object representing the persistence model for a voice capture and
 * analysis session.
 * 
 * This payload is designed to be stored in the database (e.g. Supabase) and
 * consumed by the frontend to render the analysis dashboard and replay.
 * 
 * @example
 * ```typescript
 * const session: AudioSessionDTO = {
 *   id: 'd3b07384-d113-4c4e-9c8e-cf00af50ef50',
 *   title: 'Práctica de Oratoria 1',
 *   createdAt: '2026-06-13T03:54:16Z',
 *   durationSeconds: 15.4,
 *   status: 'completed',
 *   transcription: {
 *     text: 'Hola a todos bueno... de verdad eh...',
 *     chunks: [
 *       { word: 'Hola', start: 0.1, end: 0.5, isFillerWord: false },
 *       { word: 'a', start: 0.6, end: 0.7, isFillerWord: false },
 *       { word: 'todos', start: 0.8, end: 1.1, isFillerWord: false },
 *       { word: 'bueno', start: 1.25, end: 1.8, isFillerWord: true },
 *       { word: 'de', start: 1.9, end: 2.1, isFillerWord: false },
 *       { word: 'verdad', start: 2.2, end: 2.5, isFillerWord: false },
 *       { word: 'eh', start: 2.6, end: 3.0, isFillerWord: true }
 *     ]
 *   },
 *   metrics: {
 *     overallScore: 78,
 *     fillerWordsCount: 2,
 *     wordsPerMinute: 140,
 *     fillerWordsBreakdown: { 'bueno': 1, 'eh': 1 }
 *   }
 * };
 * ```
 */
export interface AudioSessionDTO {
  /** Unique identifier for the recording session */
  id: string;
  /** Described title of the session, either user-provided or auto-generated */
  title?: string;
  /** ISO 8601 timestamp indicating when the session was created */
  createdAt: string;
  /** Duration of the recorded audio in seconds */
  durationSeconds: number;
  /** Public or signed URL referencing the physical audio file in storage (optional) */
  audioUrl?: string;
  /** Current status of the session record */
  status: 'completed' | 'processing' | 'failed';
  /** Transcription output from the model */
  transcription: {
    /** The complete transcription text */
    text: string;
    /** Ordered list of transcribed words with metadata, {@link AudioChunkDTO} */
    chunks: AudioChunkDTO[];
  };
  /** Fluency and speech metrics computed from the transcription, {@link SessionMetricsDTO} */
  metrics: SessionMetricsDTO;
}
