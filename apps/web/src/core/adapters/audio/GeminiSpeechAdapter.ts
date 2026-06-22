import { IAudioAnalyzer } from '../../ports/audio/IAudioAnalyzer';
import { TranscriptionResultDTO, RawAudioChunk } from '../../ports/audio/types';
import { CaptureError } from '../../ports/audio/CaptureError';
import { encodePCMToWAV } from './wavEncoder';

/**
 * Cache entry structure for storing partial WAV chunks in IndexedDB / Memory.
 */
interface CacheEntry {
  /** Compound key formatted as `${sessionId}_${index}` */
  id: string;
  /** Unique session ID for the recording session */
  sessionId: string;
  /** Chunk index in the segmented audio */
  index: number;
  /** Raw PCM sample length of this chunk */
  pcmLength: number;
  /** The WAV Blob (only stored while pending upload/inference) */
  wavBlob?: Blob;
  /** Transcribed text (stored when the status is 'completed') */
  text?: string;
  /** Processing status of this chunk */
  status: 'pending' | 'completed';
}

/**
 * Lightweight helper class to encapsulate IndexedDB cache operations.
 * Falls back to an in-memory database in non-browser environments (e.g. Node/Jest).
 */
class GeminiCache {
  private memoryDb = new Map<string, CacheEntry>();
  private useMemory = typeof indexedDB === 'undefined';

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CiceroGeminiCache', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('wav_chunks')) {
          db.createObjectStore('wav_chunks', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Puts a cache entry into the store (overwrites existing key).
   * 
   * @param item - The {@link CacheEntry} to store.
   */
  public async put(item: CacheEntry): Promise<void> {
    if (this.useMemory) {
      this.memoryDb.set(item.id, item);
      return;
    }
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('wav_chunks', 'readwrite');
      const store = transaction.objectStore('wav_chunks');
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes a cache entry by compound key.
   * 
   * @param id - Compound key.
   */
  public async delete(id: string): Promise<void> {
    if (this.useMemory) {
      this.memoryDb.delete(id);
      return;
    }
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('wav_chunks', 'readwrite');
      const store = transaction.objectStore('wav_chunks');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets all cache entries stored in the database.
   */
  public async getAll(): Promise<CacheEntry[]> {
    if (this.useMemory) {
      return Array.from(this.memoryDb.values());
    }
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('wav_chunks', 'readonly');
      const store = transaction.objectStore('wav_chunks');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * A basic semaphore-like concurrency controller to limit active tasks.
 */
class ConcurrencyQueue {
  private activeCount = 0;
  private queue: (() => void)[] = [];

  /**
   * @param maxConcurrency - Maximum number of active promises running concurrently.
   */
  constructor(private maxConcurrency: number) {}

  /**
   * Runs an asynchronous task wrapped within the concurrency limit constraints.
   * 
   * @param fn - Async task.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }
}

/**
 * Adapter that implements {@link IAudioAnalyzer} utilizing the Google Gemini API.
 * Segments raw PCM audio into 3-minute chunks, converts to WAV in-memory, uploads
 * via resumable protocol, and transcribes using Gemini 3.5 Flash.
 * Exposes retry mechanisms supported by local storage cache.
 * 
 * @example
 * ```typescript
 * const adapter = new GeminiSpeechAdapter(() => localStorage.getItem('gemini_api_key'));
 * const result = await adapter.analyzeAudio(pcmData);
 * ```
 */
export class GeminiSpeechAdapter implements IAudioAnalyzer {
  private cache = new GeminiCache();
  private queue = new ConcurrencyQueue(3);

  /**
   * @param apiKeyProvider - A function that resolves to the current API key at the moment of request.
   */
  constructor(private apiKeyProvider: () => string | null) {}

  /**
   * Analyzes raw audio PCM (Float32Array) by segmenting, caching, uploading concurrently,
   * performing speech-to-text inference with Gemini 3.5 Flash, and interpolating timestamps.
   * 
   * @param audioPCM - The raw audio samples (normally at 16kHz mono).
   * @returns A promise resolving to the final {@link TranscriptionResultDTO}.
   * @throws {CaptureError} If API Key is missing, network drops, or rate limit exceeded.
   */
  public async analyzeAudio(audioPCM: Float32Array): Promise<TranscriptionResultDTO> {
    const apiKey = this.apiKeyProvider();
    if (!apiKey) {
      throw new CaptureError('ANALYSIS_FAILED', 'API Key for Gemini is missing');
    }

    if (apiKey === 'sandbox') {
      return this.runSandboxSimulation(audioPCM);
    }

    const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const SAMPLES_PER_CHUNK = 16000 * 60 * 3; // 3 minutes at 16kHz
    const totalSamples = audioPCM.length;
    
    // Segment and convert to WAV Blobs
    const chunks: { index: number; pcmLength: number; wavBlob: Blob }[] = [];
    let chunkIndex = 0;
    for (let offset = 0; offset < totalSamples; offset += SAMPLES_PER_CHUNK) {
      const pcmSubarray = audioPCM.subarray(offset, Math.min(totalSamples, offset + SAMPLES_PER_CHUNK));
      const wavBlob = encodePCMToWAV(pcmSubarray, 16000);
      chunks.push({
        index: chunkIndex,
        pcmLength: pcmSubarray.length,
        wavBlob,
      });
      chunkIndex++;
    }

    // Save chunks to IndexedDB cache
    for (const chunk of chunks) {
      await this.cache.put({
        id: `${sessionId}_${chunk.index}`,
        sessionId,
        index: chunk.index,
        pcmLength: chunk.pcmLength,
        wavBlob: chunk.wavBlob,
        status: 'pending',
      });
    }

    // Run the concurrency processing loop
    try {
      await this.processSessionChunks(sessionId, apiKey);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Error occurred during Gemini transcription';
      throw new CaptureError(
        'ANALYSIS_FAILED',
        errMsg,
        { sessionId }
      );
    }

    // Assemble completed texts and timestamps
    return this.assembleSessionResults(sessionId);
  }

  /**
   * Resumes and retries analysis for an interrupted session.
   * Retrieves pending chunks from cache, performs uploads/inference, and completes the session.
   * 
   * @param sessionId - Session identifier.
   * @returns A promise resolving to the final {@link TranscriptionResultDTO}.
   * @throws {CaptureError} If retry processing fails.
   */
  public async retryAnalysis(sessionId: string): Promise<TranscriptionResultDTO> {
    const apiKey = this.apiKeyProvider();
    if (!apiKey) {
      throw new CaptureError('ANALYSIS_FAILED', 'API Key for Gemini is missing');
    }

    if (apiKey === 'sandbox') {
      throw new CaptureError('ANALYSIS_FAILED', 'Cannot retry a sandbox session');
    }

    const allEntries = await this.cache.getAll();
    const sessionEntries = allEntries.filter((item) => item.sessionId === sessionId);
    if (sessionEntries.length === 0) {
      throw new CaptureError('ANALYSIS_FAILED', `No cached chunks found for session ${sessionId}`);
    }

    try {
      await this.processSessionChunks(sessionId, apiKey);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Error occurred during Gemini transcription retry';
      throw new CaptureError(
        'ANALYSIS_FAILED',
        errMsg,
        { sessionId }
      );
    }

    return this.assembleSessionResults(sessionId);
  }

  /**
   * Processes all cached chunks for a session through the concurrency queue.
   */
  private async processSessionChunks(sessionId: string, apiKey: string): Promise<void> {
    const allEntries = await this.cache.getAll();
    const sessionEntries = allEntries.filter((item) => item.sessionId === sessionId);
    
    // Sort to process chunks sequentially
    sessionEntries.sort((a, b) => a.index - b.index);

    const promises = sessionEntries.map((entry) => {
      return this.queue.run(async () => {
        if (entry.status === 'completed') {
          return; // Skip already completed
        }

        if (!entry.wavBlob) {
          throw new Error(`Missing WAV Blob for chunk ${entry.index} of session ${sessionId}`);
        }

        // 1. Resumable upload (Google Files API)
        const uploadUrl = await this.initiateResumableUpload(entry.index, entry.wavBlob.size, apiKey);
        const fileMetadata = await this.performUpload(uploadUrl, entry.wavBlob);

        // 2. Gemini generation content call
        const text = await this.generateContent(fileMetadata.uri, apiKey);

        // 3. Delete file from Google Cloud (clean up)
        await this.deleteUploadedFile(fileMetadata.name, apiKey);

        // 4. Update cache: mark chunk as completed
        await this.cache.put({
          id: entry.id,
          sessionId: entry.sessionId,
          index: entry.index,
          pcmLength: entry.pcmLength,
          text,
          status: 'completed',
        });
      });
    });

    const results = await Promise.allSettled(promises);

    // Check if any promise rejected and throw the first error found
    const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (failures.length > 0) {
      throw failures[0].reason;
    }
  }


  private async initiateResumableUpload(index: number, sizeBytes: number, apiKey: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': sizeBytes.toString(),
        'X-Goog-Upload-Header-Content-Type': 'audio/wav',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          displayName: `audio_chunk_${index}.wav`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Resumable upload initialization failed: ${response.status} ${response.statusText}`);
    }

    const uploadUrl = response.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
      throw new Error('Missing X-Goog-Upload-URL in response headers');
    }

    return uploadUrl;
  }

  private async performUpload(uploadUrl: string, wavBlob: Blob): Promise<{ uri: string; name: string }> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: wavBlob,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const uri = data.file?.uri;
    const name = data.file?.name;
    if (!uri || !name) {
      throw new Error('Missing file uri or name in upload response');
    }

    return { uri, name };
  }

  private async generateContent(fileUri: string, apiKey: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                fileData: {
                  mimeType: 'audio/wav',
                  fileUri: fileUri,
                },
              },
              {
                text: 'Transcribe el siguiente audio palabra por palabra. Mantén todas las muletillas (como eh, bueno, mmm, este, o sea), tartamudeos y repeticiones. Responde ÚNICAMENTE con un objeto JSON usando el siguiente esquema: { "text": "la transcripción completa" }.',
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini inference failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textPart) {
      throw new Error('Missing text in Gemini response candidate');
    }

    let transcribedText = '';
    try {
      const parsed = JSON.parse(textPart);
      transcribedText = parsed.text || textPart;
    } catch {
      transcribedText = textPart;
    }

    return transcribedText;
  }

  private async deleteUploadedFile(fileName: string, apiKey: string): Promise<void> {
    const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.warn(`Failed to delete temporary file ${fileName}: ${response.status} ${response.statusText}`);
    }
  }

  private async assembleSessionResults(sessionId: string): Promise<TranscriptionResultDTO> {
    const allEntries = await this.cache.getAll();
    const sessionEntries = allEntries.filter((item) => item.sessionId === sessionId);
    
    // Sort chunks to assemble in order
    sessionEntries.sort((a, b) => a.index - b.index);

    const fullTexts: string[] = [];
    const allChunks: RawAudioChunk[] = [];
    const SAMPLES_PER_CHUNK = 16000 * 60 * 3; // 3 minutes

    for (const entry of sessionEntries) {
      if (entry.status !== 'completed' || entry.text === undefined) {
        throw new Error(`Cannot assemble results: chunk ${entry.index} is not completed`);
      }

      const text = entry.text.trim();
      if (text.length > 0) {
        fullTexts.push(text);
      }

      const timeOffset = (entry.index * SAMPLES_PER_CHUNK) / 16000;
      const chunkDuration = entry.pcmLength / 16000;

      // Interpolate word-level timestamps linearly
      const words = text.split(/\s+/).filter((w: string) => w.length > 0);
      if (words.length > 0) {
        const wordDuration = chunkDuration / words.length;
        for (let j = 0; j < words.length; j++) {
          allChunks.push({
            word: words[j],
            start: Number((timeOffset + j * wordDuration).toFixed(2)),
            end: Number((timeOffset + (j + 1) * wordDuration).toFixed(2)),
          });
        }
      }
    }

    // Clean up cache entries for this session
    for (const entry of sessionEntries) {
      await this.cache.delete(entry.id);
    }

    return {
      text: fullTexts.join(' '),
      chunks: allChunks,
    };
  }

  private runSandboxSimulation(audioPCM: Float32Array): Promise<TranscriptionResultDTO> {
    const duration = audioPCM.length / 16000;
    const mockText = 'Hola a todos, sean bienvenidos a esta simulación de Cicero. Bueno... de verdad eh... espero que la herramienta les sirva de mucho.';
    const words = mockText.split(/\s+/).filter((w) => w.length > 0);
    const wordDuration = duration / words.length;
    
    const chunks: RawAudioChunk[] = words.map((word, i) => ({
      word,
      start: Number((i * wordDuration).toFixed(2)),
      end: Number(((i + 1) * wordDuration).toFixed(2)),
    }));

    return Promise.resolve({
      text: mockText,
      chunks,
    });
  }
}
