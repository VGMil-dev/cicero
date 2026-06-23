/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { FakeAudioModelBootstrap } from '../core/SpeechToText/ModelBootstrap.mock';
import { FakeAudioRecorder } from '../core/Recorder/AudioRecorder.mock';

describe('useAudioCapture Hook', () => {
  let bootstrap: FakeAudioModelBootstrap;
  let recorder: FakeAudioRecorder;
  let decoder: any;
  let analyzer: any;
  let calculateScoreUseCase: any;

  beforeEach(() => {
    bootstrap = new FakeAudioModelBootstrap({ progressInterval: 10 });
    recorder = new FakeAudioRecorder();
    decoder = {
      decodeTo16kHzMono: jest.fn().mockResolvedValue(new Float32Array([0.1, 0.2])),
    };
    analyzer = {
      analyzeAudio: jest.fn().mockResolvedValue({
        text: 'Hola eh bueno',
        chunks: [
          { word: 'Hola', start: 0.1, end: 0.5 },
          { word: 'eh', start: 0.6, end: 1.0 },
          { word: 'bueno', start: 1.1, end: 1.5 },
        ],
      }),
    };
    calculateScoreUseCase = {
      execute: jest.fn().mockReturnValue({
        metrics: {
          overallScore: 66,
          fillerWordsCount: 2,
          wordsPerMinute: 120,
          fillerWordsBreakdown: { eh: 1, bueno: 1 },
        },
        chunks: [
          { word: 'Hola', start: 0.1, end: 0.5, isFillerWord: false },
          { word: 'eh', start: 0.6, end: 1.0, isFillerWord: true },
          { word: 'bueno', start: 1.1, end: 1.5, isFillerWord: true },
        ],
      }),
    };
  });

  it('should start in idle state', () => {
    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.scoreResult).toBeNull();
  });

  it('should initialize model successfully', async () => {
    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    let initPromise: Promise<void>;
    act(() => {
      initPromise = result.current.initializeModel();
    });

    expect(result.current.state).toBe('loading-model');

    await act(async () => {
      await initPromise;
    });

    expect(result.current.state).toBe('ready');
    expect(result.current.error).toBeNull();
  });

  it('should fail model initialization when shouldFail is true', async () => {
    bootstrap = new FakeAudioModelBootstrap({ shouldFail: true, progressInterval: 10 });
    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    let initPromise: Promise<void>;
    act(() => {
      initPromise = result.current.initializeModel();
    });

    await act(async () => {
      try {
        await initPromise;
      } catch {
        // expected error throwing
      }
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe('MODEL_LOAD_FAILED');
  });

  it('should transition to recording and trigger decoding, analysis and scoring when stopRecording is called', async () => {
    recorder = new FakeAudioRecorder({ grantPermission: true });

    // Diferir la resolución de la decodificación para poder capturar el estado intermedio isAnalyzing = true
    let resolveDecoding: (val: Float32Array) => void = () => {};
    const decodingPromise = new Promise<Float32Array>((resolve) => {
      resolveDecoding = resolve;
    });
    decoder.decodeTo16kHzMono.mockReturnValue(decodingPromise);

    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    await act(async () => {
      await result.current.initializeModel();
    });

    expect(result.current.state).toBe('ready');

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('recording');

    let stopPromise: Promise<void>;
    act(() => {
      stopPromise = result.current.stopRecording();
    });

    // Esperar a que isAnalyzing cambie a true usando waitFor de manera robusta
    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(true);
    });

    // Resolver el decoder para que finalice el flujo completo
    await act(async () => {
      resolveDecoding(new Float32Array([0.1, 0.2]));
      await stopPromise;
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(decoder.decodeTo16kHzMono).toHaveBeenCalled();
    expect(analyzer.analyzeAudio).toHaveBeenCalled();
    expect(calculateScoreUseCase.execute).toHaveBeenCalled();
    expect(result.current.scoreResult).not.toBeNull();
    expect(result.current.scoreResult?.metrics.overallScore).toBe(66);
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
  });

  it('should fail startRecording if permission is denied', async () => {
    recorder = new FakeAudioRecorder({ grantPermission: false });
    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    await act(async () => {
      await result.current.initializeModel();
    });

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('PERMISSION_DENIED');
  });

  it('should fail startRecording if recording start fails', async () => {
    recorder = new FakeAudioRecorder({ shouldFailOnStart: true });
    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    await act(async () => {
      await result.current.initializeModel();
    });

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('RECORDING_FAILED');
  });

  it('should handle decoding failure and transition to error state', async () => {
    recorder = new FakeAudioRecorder({ grantPermission: true });
    decoder.decodeTo16kHzMono.mockRejectedValue(new Error('Decoding error'));

    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    await act(async () => {
      await result.current.initializeModel();
    });

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('DECODING_FAILED');
    expect(result.current.error?.message).toBe('Decoding error');
  });

  it('should handle analysis failure and transition to error state', async () => {
    recorder = new FakeAudioRecorder({ grantPermission: true });
    analyzer.analyzeAudio.mockRejectedValue(new Error('ASR analysis error'));

    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    await act(async () => {
      await result.current.initializeModel();
    });

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('ANALYSIS_FAILED');
    expect(result.current.error?.message).toBe('ASR analysis error');
  });

  it('should call bootstrap.terminate and reset state to idle when calling terminateWorker', () => {
    const { result } = renderHook(() =>
      useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase)
    );

    act(() => {
      void result.current.initializeModel();
    });

    expect(result.current.state).toBe('loading-model');

    const terminateSpy = jest.spyOn(bootstrap, 'terminate');

    act(() => {
      result.current.terminateWorker();
    });

    expect(terminateSpy).toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.scoreResult).toBeNull();
  });
});
