import { renderHook, act } from '@testing-library/react';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { FakeAudioModelBootstrap, FakeAudioRecorder } from '../core/ports/audio/mocks';

describe('useAudioCapture Hook', () => {
  it('should start in idle state', () => {
    const bootstrap = new FakeAudioModelBootstrap();
    const recorder = new FakeAudioRecorder();
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.audioBlob).toBeNull();
  });

  it('should initialize model successfully', async () => {
    const bootstrap = new FakeAudioModelBootstrap({ progressInterval: 10 });
    const recorder = new FakeAudioRecorder();
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

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
    const bootstrap = new FakeAudioModelBootstrap({ shouldFail: true, progressInterval: 10 });
    const recorder = new FakeAudioRecorder();
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

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

  it('should transition to recording and stop with a blob', async () => {
    const bootstrap = new FakeAudioModelBootstrap({ progressInterval: 10 });
    const recorder = new FakeAudioRecorder({ grantPermission: true });
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

    await act(async () => {
      await result.current.initializeModel();
    });

    expect(result.current.state).toBe('ready');

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('recording');

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.state).toBe('ready');
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
    expect(result.current.audioBlob?.type).toBe('audio/webm');
  });

  it('should fail startRecording if permission is denied', async () => {
    const bootstrap = new FakeAudioModelBootstrap({ progressInterval: 10 });
    const recorder = new FakeAudioRecorder({ grantPermission: false });
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

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
    const bootstrap = new FakeAudioModelBootstrap({ progressInterval: 10 });
    const recorder = new FakeAudioRecorder({ shouldFailOnStart: true });
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

    await act(async () => {
      await result.current.initializeModel();
    });

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('RECORDING_FAILED');
  });

  it('should call bootstrap.terminate and reset state to idle when calling terminateWorker', () => {
    const bootstrap = new FakeAudioModelBootstrap({ progressInterval: 10 });
    const recorder = new FakeAudioRecorder();
    const { result } = renderHook(() => useAudioCapture(bootstrap, recorder));

    let initPromise: Promise<void>;
    act(() => {
      initPromise = result.current.initializeModel();
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
  });
});

