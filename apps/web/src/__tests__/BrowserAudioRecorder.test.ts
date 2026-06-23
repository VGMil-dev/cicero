import { BrowserAudioRecorder } from '../core/Recorder/BrowserAudioRecorder.adapter';
import { CaptureError } from '../core/shared/CaptureError';

describe('BrowserAudioRecorder Adapter', () => {
  let originalNavigator: typeof navigator;
  let originalMediaRecorder: typeof MediaRecorder;

  const mockTrack = {
    stop: jest.fn(),
  };

  const mockStream = {
    getTracks: () => [mockTrack],
  };

  const mockGetUserMedia = jest.fn();

  class MockMediaRecorder {
    static isTypeSupported = jest.fn();
    state: 'inactive' | 'recording' | 'paused' = 'inactive';
    stream: unknown;
    options?: MediaRecorderOptions;
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;

    constructor(stream: unknown, options?: MediaRecorderOptions) {
      this.stream = stream;
      this.options = options;
    }

    start = jest.fn().mockImplementation(() => {
      this.state = 'recording';
    });

    stop = jest.fn().mockImplementation(() => {
      this.state = 'inactive';
      if (this.ondataavailable) {
        // Emit mock chunk data
        this.ondataavailable({ data: new Blob(['audio-data'], { type: 'audio/webm' }) });
      }
      if (this.onstop) {
        this.onstop();
      }
    });
  }

  beforeAll(() => {
    originalNavigator = global.navigator;
    originalMediaRecorder = global.MediaRecorder;

    // Define navigator.mediaDevices if not present
    if (!global.navigator) {
      (global as unknown as { navigator: Navigator }).navigator = {} as Navigator;
    }
    
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    global.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });

  afterAll(() => {
    global.navigator = originalNavigator;
    global.MediaRecorder = originalMediaRecorder;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    MockMediaRecorder.isTypeSupported.mockReturnValue(true);
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  describe('Constructor & mimeType Selection', () => {
    it('should select supported mimeType on creation', () => {
      MockMediaRecorder.isTypeSupported.mockImplementation((type: string) => {
        return type === 'audio/webm';
      });

      new BrowserAudioRecorder();
      expect(MockMediaRecorder.isTypeSupported).toHaveBeenCalledWith('audio/webm;codecs=opus');
      expect(MockMediaRecorder.isTypeSupported).toHaveBeenCalledWith('audio/webm');
    });
  });

  describe('requestPermissions()', () => {
    it('should return microphoneGranted: true and stop tracks if permission is granted', async () => {
      const recorder = new BrowserAudioRecorder();
      const perms = await recorder.requestPermissions();

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(perms.microphoneGranted).toBe(true);
    });

    it('should return microphoneGranted: false if getUserMedia rejects', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
      const recorder = new BrowserAudioRecorder();
      const perms = await recorder.requestPermissions();

      expect(perms.microphoneGranted).toBe(false);
      expect(mockTrack.stop).not.toHaveBeenCalled();
    });

    it('should return microphoneGranted: false if mediaDevices API is not available', async () => {
      const originalMediaDevices = global.navigator.mediaDevices;
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const recorder = new BrowserAudioRecorder();
      const perms = await recorder.requestPermissions();

      expect(perms.microphoneGranted).toBe(false);

      // Restore
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        configurable: true,
        value: originalMediaDevices,
      });
    });
  });

  describe('startRecording()', () => {
    it('should successfully request stream and start recording', async () => {
      const recorder = new BrowserAudioRecorder();
      await expect(recorder.startRecording()).resolves.toBeUndefined();

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should throw PERMISSION_DENIED if microphone access fails', async () => {
      const accessError = new Error('Hardware error');
      mockGetUserMedia.mockRejectedValue(accessError);

      const recorder = new BrowserAudioRecorder();
      await expect(recorder.startRecording()).rejects.toThrow(CaptureError);
      
      try {
        await recorder.startRecording();
      } catch (err) {
        const captureError = err as CaptureError;
        expect(captureError.dto.code).toBe('PERMISSION_DENIED');
        expect(captureError.dto.message).toContain('Microphone access was denied or unavailable');
        expect(captureError.dto.details).toBe(accessError);
      }
    });

    it('should throw RECORDING_FAILED if startRecording is called while already recording', async () => {
      const recorder = new BrowserAudioRecorder();
      await recorder.startRecording();

      await expect(recorder.startRecording()).rejects.toThrow(CaptureError);
      try {
        await recorder.startRecording();
      } catch (err) {
        const captureError = err as CaptureError;
        expect(captureError.dto.code).toBe('RECORDING_FAILED');
        expect(captureError.dto.message).toBe('Recording is already in progress');
      }
    });
  });

  describe('stopRecording()', () => {
    it('should stop the recorder, release the stream, and resolve with the audio Blob', async () => {
      const recorder = new BrowserAudioRecorder();
      await recorder.startRecording();

      const stopPromise = recorder.stopRecording();
      
      const blob = await stopPromise;
      expect(blob).toBeInstanceOf(Blob);
      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it('should throw RECORDING_FAILED if stopRecording is called when inactive', async () => {
      const recorder = new BrowserAudioRecorder();
      await expect(recorder.stopRecording()).rejects.toThrow(CaptureError);

      try {
        await recorder.stopRecording();
      } catch (err) {
        const captureError = err as CaptureError;
        expect(captureError.dto.code).toBe('RECORDING_FAILED');
        expect(captureError.dto.message).toBe('No active recording to stop');
      }
    });
  });

  describe('cancelRecording()', () => {
    it('should stop recorder, release tracks, and clean up state without resolving a blob', async () => {
      const recorder = new BrowserAudioRecorder();
      await recorder.startRecording();
      
      recorder.cancelRecording();
      
      expect(mockTrack.stop).toHaveBeenCalled();
      
      // Attempting to stop again should throw RECORDING_FAILED because it was cleaned up
      await expect(recorder.stopRecording()).rejects.toThrow(CaptureError);
    });
  });
});
