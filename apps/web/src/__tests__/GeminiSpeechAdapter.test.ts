import { GeminiSpeechAdapter } from '../core/adapters/audio/GeminiSpeechAdapter';
import { CaptureError } from '../core/ports/audio/CaptureError';

describe('GeminiSpeechAdapter Unit Tests', () => {
  let mockApiKey: string | null = null;
  const apiKeyProvider = () => mockApiKey;
  let adapter: GeminiSpeechAdapter;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    mockApiKey = 'test-api-key';
    adapter = new GeminiSpeechAdapter(apiKeyProvider);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper to setup mock fetch dynamically and handle concurrency safely
  const setupMockFetch = (transcriptions: string[], failIndex?: number) => {
    (global.fetch as jest.Mock).mockImplementation((url: string | Request | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      const method = init?.method || 'GET';

      // 1. Resumable Upload Initialization
      if (urlStr.includes('upload/v1beta/files')) {
        const body = JSON.parse(init?.body as string);
        const displayName = body.file?.displayName || 'audio_chunk_0.wav';
        const idxStr = displayName.split('audio_chunk_')[1].split('.wav')[0];
        const idx = parseInt(idxStr, 10);
        
        if (failIndex !== undefined && idx === failIndex) {
          return Promise.reject(new Error('Network disconnected / 429 Limit'));
        }

        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-Goog-Upload-URL' ? `https://upload.url/sessions/session_${idx}` : null,
          }
        });
      }


      // 2. Perform Resumable Upload
      if (urlStr.includes('upload.url/sessions/')) {
        const idxStr = urlStr.split('session_')[1];
        const idx = parseInt(idxStr, 10);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            file: {
              uri: `https://generativelanguage.googleapis.com/v1beta/files/file_${idx}`,
              name: `files/file_${idx}`
            }
          })
        });
      }

      // 3. Gemini Generate Content
      if (urlStr.includes('generateContent')) {
        const body = JSON.parse(init?.body as string);
        const fileUri = body.contents[0].parts[0].fileData.fileUri;
        const idxStr = fileUri.split('file_')[1];
        const idx = parseInt(idxStr, 10);
        const text = transcriptions[idx] || 'Default text';
        
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({ text })
                }]
              }
            }]
          })
        });
      }

      // 4. File Cleanup (DELETE)
      if (method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }

      return Promise.reject(new Error(`Unhandled fetch mock URL: ${urlStr}`));
    });
  };

  it('should throw CaptureError with ANALYSIS_FAILED if API Key is missing', async () => {
    mockApiKey = null;
    const pcm = new Float32Array(16000 * 2); // 2 seconds

    await expect(adapter.analyzeAudio(pcm)).rejects.toThrow(CaptureError);
    try {
      await adapter.analyzeAudio(pcm);
    } catch (err) {
      if (err instanceof CaptureError) {
        expect(err.dto.code).toBe('ANALYSIS_FAILED');
        expect(err.dto.message).toContain('API Key for Gemini is missing');
      } else {
        throw err;
      }
    }
  });

  it('should run sandbox simulation without network calls when key is sandbox', async () => {
    mockApiKey = 'sandbox';
    const pcm = new Float32Array(16000 * 10); // 10 seconds

    const result = await adapter.analyzeAudio(pcm);
    expect(result.text).toContain('simulación de Cicero');
    expect(result.chunks.length).toBeGreaterThan(0);
    
    // Check linear timestamps
    expect(result.chunks[0].start).toBe(0.0);
    const lastChunk = result.chunks[result.chunks.length - 1];
    expect(lastChunk.end).toBeCloseTo(10.0, 1);
    
    // Verify zero fetch calls
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should process a single segment successfully in normal flow', async () => {
    const pcm = new Float32Array(16000 * 5); // 5 seconds (1 chunk)
    setupMockFetch(['Hola a todos']);

    const result = await adapter.analyzeAudio(pcm);
    
    expect(result.text).toBe('Hola a todos');
    expect(result.chunks).toEqual([
      { word: 'Hola', start: 0.0, end: 1.67 },
      { word: 'a', start: 1.67, end: 3.33 },
      { word: 'todos', start: 3.33, end: 5.0 },
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('should segment long audios and compile them into combined text and timestamps', async () => {
    // 16000 samples/sec * 60 sec/min * 3 min = 2,880,000 samples
    // Let's create an audio of 4 minutes = 240 seconds
    const sampleRate = 16000;
    const pcm = new Float32Array(sampleRate * 240); // 4 minutes
    setupMockFetch(['Parte uno', 'Parte dos']);

    const result = await adapter.analyzeAudio(pcm);
    expect(result.text).toBe('Parte uno Parte dos');
    expect(result.chunks.length).toBe(4);
    
    // Chunk 0 (0 to 180 seconds - 3 minutes): "Parte uno" (2 words -> 90 sec each)
    expect(result.chunks[0]).toEqual({ word: 'Parte', start: 0.0, end: 90.0 });
    expect(result.chunks[1]).toEqual({ word: 'uno', start: 90.0, end: 180.0 });
    
    // Chunk 1 (180 to 240 seconds - 1 minute duration): "Parte dos" (2 words -> 30 sec each)
    expect(result.chunks[2]).toEqual({ word: 'Parte', start: 180.0, end: 210.0 });
    expect(result.chunks[3]).toEqual({ word: 'dos', start: 210.0, end: 240.0 });

    expect(global.fetch).toHaveBeenCalledTimes(8);
  });

  it('should support resiliency cache and allow retrying failed chunks', async () => {
    // 4 minutes audio (2 chunks)
    const pcm = new Float32Array(16000 * 240);
    
    // Setup fetch to fail on Chunk 1 (second chunk, index 1)
    setupMockFetch(['Primero', 'Segundo'], 1);

    let sessionId = '';
    try {
      await adapter.analyzeAudio(pcm);
      throw new Error('Expected analyzeAudio to throw CaptureError');
    } catch (err) {
      expect(err).toBeInstanceOf(CaptureError);
      if (err instanceof CaptureError) {
        expect(err.dto.code).toBe('ANALYSIS_FAILED');
        expect(err.dto.details).toHaveProperty('sessionId');
        sessionId = (err.dto.details as { sessionId: string }).sessionId;
      }
    }
    
    expect(sessionId).not.toBe('');


    // Clear and configure mock fetch to succeed on Chunk 1 now (which will be processed during retry)
    jest.clearAllMocks();
    setupMockFetch(['Primero', 'Segundo']); // Both chunks successful

    // Retry the analysis
    const result = await adapter.retryAnalysis(sessionId);
    
    expect(result.text).toBe('Primero Segundo');
    expect(result.chunks.length).toBe(2);
    
    // Chunk 0 (0-180s): "Primero" (1 word)
    expect(result.chunks[0]).toEqual({ word: 'Primero', start: 0.0, end: 180.0 });
    // Chunk 1 (180-240s): "Segundo" (1 word)
    expect(result.chunks[1]).toEqual({ word: 'Segundo', start: 180.0, end: 240.0 });

    // Verify Chunk 1 was processed and completed (Chunk 0 was already skipped since status was completed)
    // For Chunk 1: init, perform upload, generate content, delete = 4 calls
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
