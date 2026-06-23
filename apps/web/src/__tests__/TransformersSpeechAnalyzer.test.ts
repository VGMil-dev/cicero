import { TransformersSpeechAnalyzer } from '../core/SpeechToText/TransformersSpeechAnalyzer.adapter';
import { ModelBootstrap } from '../core/SpeechToText/ModelBootstrap.port';
import { AudioDecoder } from '../core/AudioDecoder/AudioDecoder.port';
import { CaptureError } from '../core/shared/CaptureError';
import { AudioCaptureState } from '../core/shared/types';

interface MockWorkerInstance {
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((error: ErrorEvent) => void) | null;
  postMessage: jest.Mock;
  terminate: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

interface MockWorkerConstructor {
  instances: MockWorkerInstance[];
}

describe('TransformersSpeechAnalyzer Unit Tests', () => {
  let MockWorkerClass: MockWorkerConstructor;
  let mockBootstrap: jest.Mocked<ModelBootstrap>;
  let mockDecoder: jest.Mocked<AudioDecoder>;
  let mockWorker: MockWorkerInstance;

  beforeEach(() => {
    MockWorkerClass = (global as unknown as { MockWorker: MockWorkerConstructor }).MockWorker;
    MockWorkerClass.instances = [];
    jest.clearAllMocks();

    mockWorker = {
      onmessage: null,
      onerror: null,
      postMessage: jest.fn(),
      terminate: jest.fn(),
      addEventListener: jest.fn().mockImplementation((event, callback) => {
        if (event === 'message') mockWorker.onmessage = callback;
        if (event === 'error') mockWorker.onerror = callback;
      }),
      removeEventListener: jest.fn(),
    };

    mockBootstrap = {
      initialize: jest.fn(),
      onProgress: jest.fn(),
      getState: jest.fn().mockReturnValue('ready' as AudioCaptureState),
      terminate: jest.fn(),
      getWorkerInstance: jest.fn().mockReturnValue(mockWorker),
    };

    mockDecoder = {
      decodeTo16kHzMono: jest.fn(),
    };
  });

  it('should throw CaptureError if bootstrap state is not ready', async () => {
    mockBootstrap.getState.mockReturnValue('idle' as AudioCaptureState);
    const adapter = new TransformersSpeechAnalyzer(mockBootstrap);

    const audioData = new Float32Array([1, 2, 3]);
    await expect(adapter.analyzeAudio(audioData)).rejects.toThrow(CaptureError);
    
    try {
      await adapter.analyzeAudio(audioData);
    } catch (err: unknown) {
      const captureError = err as CaptureError;
      expect(captureError.dto.code).toBe('ANALYSIS_FAILED');
      expect(captureError.dto.message).toContain('AI model is not initialized or ready');
    }
  });

  it('should successfully post message to worker and resolve on ANALYSIS_SUCCESS', async () => {
    const adapter = new TransformersSpeechAnalyzer(mockBootstrap);
    const audioData = new Float32Array([1, 2, 3]);

    const resultPromise = adapter.analyzeAudio(audioData);

    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      {
        type: 'ANALYZE_AUDIO',
        payload: audioData,
      },
      [audioData.buffer]
    );

    // Simulate success response from worker
    const mockResult = {
      text: 'decoded transcription',
      chunks: [{ word: 'decoded', start: 0, end: 1 }],
    };

    if (mockWorker.onmessage) {
      mockWorker.onmessage({
        data: {
          type: 'ANALYSIS_SUCCESS',
          payload: mockResult,
        },
      } as MessageEvent);
    }

    const result = await resultPromise;
    expect(result).toEqual(mockResult);
    expect(mockWorker.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('should reject with CaptureError when worker returns ERROR message', async () => {
    const adapter = new TransformersSpeechAnalyzer(mockBootstrap);
    const audioData = new Float32Array([1, 2, 3]);

    const resultPromise = adapter.analyzeAudio(audioData);

    // Simulate error response from worker
    if (mockWorker.onmessage) {
      mockWorker.onmessage({
        data: {
          type: 'ERROR',
          payload: {
            code: 'ANALYSIS_FAILED',
            message: 'Inference ran out of memory',
          },
        },
      } as MessageEvent);
    }

    await expect(resultPromise).rejects.toThrow(CaptureError);
    try {
      await resultPromise;
    } catch (err: unknown) {
      const captureError = err as CaptureError;
      expect(captureError.dto.code).toBe('ANALYSIS_FAILED');
      expect(captureError.dto.message).toBe('Inference ran out of memory');
    }
  });

  it('should reject with WASM_PANIC when worker crashes (onerror)', async () => {
    const adapter = new TransformersSpeechAnalyzer(mockBootstrap);
    const audioData = new Float32Array([1, 2, 3]);

    const resultPromise = adapter.analyzeAudio(audioData);

    // Simulate onerror event
    if (mockWorker.onerror) {
      mockWorker.onerror({
        message: 'OOM in WASM memory allocation',
      } as ErrorEvent);
    }

    await expect(resultPromise).rejects.toThrow(CaptureError);
    try {
      await resultPromise;
    } catch (err: unknown) {
      const captureError = err as CaptureError;
      expect(captureError.dto.code).toBe('WASM_PANIC');
      expect(captureError.dto.message).toContain('OOM in WASM memory allocation');
    }
  });

  it('should decode Blob using AudioDecoder if Blob is passed', async () => {
    const adapter = new TransformersSpeechAnalyzer(mockBootstrap, mockDecoder);
    const audioBlob = new Blob(['raw-audio'], { type: 'audio/wav' });
    const decodedPCM = new Float32Array([4, 5, 6]);

    mockDecoder.decodeTo16kHzMono.mockResolvedValue(decodedPCM);

    const resultPromise = adapter.analyzeAudio(audioBlob);

    // Let microtasks run so decodeTo16kHzMono resolves
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockDecoder.decodeTo16kHzMono).toHaveBeenCalledWith(audioBlob);
    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      {
        type: 'ANALYZE_AUDIO',
        payload: decodedPCM,
      },
      [decodedPCM.buffer]
    );

    // Simulate success
    if (mockWorker.onmessage) {
      mockWorker.onmessage({
        data: {
          type: 'ANALYSIS_SUCCESS',
          payload: { text: 'blob text', chunks: [] },
        },
      } as MessageEvent);
    }

    const result = await resultPromise;
    expect(result.text).toBe('blob text');
  });

  it('should throw CaptureError with DECODING_FAILED if Blob is passed but no decoder was provided', async () => {
    const adapter = new TransformersSpeechAnalyzer(mockBootstrap);
    const audioBlob = new Blob(['raw-audio'], { type: 'audio/wav' });

    await expect(adapter.analyzeAudio(audioBlob)).rejects.toThrow(CaptureError);
    try {
      await adapter.analyzeAudio(audioBlob);
    } catch (err: unknown) {
      const captureError = err as CaptureError;
      expect(captureError.dto.code).toBe('DECODING_FAILED');
      expect(captureError.dto.message).toContain('Audio decoding requires an AudioDecoder instance');
    }
  });
});
