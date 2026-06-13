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
 * Data Transfer Object representing the loading progress of the AI model.
 */
export interface ProgressDTO {
  /** Percentage of completion from 0 to 100 */
  progress: number;
  /** Current stage description (e.g., 'downloading', 'extracting', 'loading') */
  stage: string;
  /** Estimated time to completion in milliseconds, if available */
  estimatedTimeRemaining?: number;
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
 */
export type ErrorCode = 'PERMISSION_DENIED' | 'MODEL_LOAD_FAILED' | 'RECORDING_FAILED' | 'UNKNOWN';

/**
 * Data Transfer Object for error reporting in the audio flow.
 */
export interface ErrorDTO {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional technical details or stack traces */
  details?: unknown;
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
