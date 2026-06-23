import { BrowserAudioDecoder } from '../core/AudioDecoder/BrowserAudioDecoder.adapter';
import { CaptureError } from '../core/shared/CaptureError';

describe('BrowserAudioDecoder Adapter', () => {
  let MockOfflineAudioContextClass: any;
  let mockSourceNode: any;
  let mockDecodedBuffer: any;
  let mockRenderedBuffer: any;
  let decodeAudioDataSpy: jest.SpyInstance;
  let createBufferSourceSpy: jest.SpyInstance;
  let startRenderingSpy: jest.SpyInstance;

  beforeAll(() => {
    Blob.prototype.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSourceNode = {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
    };

    mockDecodedBuffer = {
      sampleRate: 44100,
      numberOfChannels: 2,
      duration: 2.0,
      getChannelData: jest.fn().mockReturnValue(new Float32Array([0.5, -0.5])),
    };

    mockRenderedBuffer = {
      sampleRate: 16000,
      numberOfChannels: 1,
      duration: 2.0,
      getChannelData: jest.fn().mockReturnValue(new Float32Array([0.1, -0.1])),
    };

    // Concrete mock class for OfflineAudioContext
    class MockOfflineAudioContext {
      static instances: MockOfflineAudioContext[] = [];
      
      numberOfChannels: number;
      length: number;
      sampleRate: number;
      destination = {};

      constructor(numberOfChannels: number, length: number, sampleRate: number) {
        this.numberOfChannels = numberOfChannels;
        this.length = length;
        this.sampleRate = sampleRate;
        MockOfflineAudioContext.instances.push(this);
      }

      decodeAudioData(arrayBuffer: ArrayBuffer): Promise<any> {
        return Promise.resolve(mockDecodedBuffer);
      }
      createBufferSource(): any {
        return mockSourceNode;
      }
      startRendering(): Promise<any> {
        return Promise.resolve(mockRenderedBuffer);
      }
    }

    MockOfflineAudioContextClass = MockOfflineAudioContext;
    MockOfflineAudioContext.instances = [];
    decodeAudioDataSpy = jest.spyOn(MockOfflineAudioContext.prototype, 'decodeAudioData');
    createBufferSourceSpy = jest.spyOn(MockOfflineAudioContext.prototype, 'createBufferSource');
    startRenderingSpy = jest.spyOn(MockOfflineAudioContext.prototype, 'startRendering');
  });

  it('should initialize with default parameters and be instantiable without args', () => {
    const decoder = new BrowserAudioDecoder();
    expect(decoder).toBeDefined();
  });

  it('should throw CaptureError with DECODING_FAILED if OfflineAudioContext is not supported', async () => {
    const decoder = new BrowserAudioDecoder(null as any);
    const blob = new Blob(['audio-binary'], { type: 'audio/webm' });

    await expect(decoder.decodeTo16kHzMono(blob)).rejects.toThrow(CaptureError);
    try {
      await decoder.decodeTo16kHzMono(blob);
    } catch (error) {
      const captureError = error as CaptureError;
      expect(captureError.dto.code).toBe('DECODING_FAILED');
      expect(captureError.dto.message).toContain('not supported');
    }
  });

  it('should throw CaptureError with DECODING_FAILED if Blob.arrayBuffer fails', async () => {
    const decoder = new BrowserAudioDecoder(MockOfflineAudioContextClass);
    
    // Create a mock Blob where arrayBuffer() throws an error
    const brokenBlob = new Blob();
    brokenBlob.arrayBuffer = jest.fn().mockRejectedValue(new Error('Read error'));

    await expect(decoder.decodeTo16kHzMono(brokenBlob)).rejects.toThrow(CaptureError);
    try {
      await decoder.decodeTo16kHzMono(brokenBlob);
    } catch (error) {
      const captureError = error as CaptureError;
      expect(captureError.dto.code).toBe('DECODING_FAILED');
      expect(captureError.dto.message).toContain('Failed to read audio blob content');
    }
  });

  it('should decode and resample non-16kHz stereo audio to 16kHz mono Float32Array', async () => {
    const decoder = new BrowserAudioDecoder(MockOfflineAudioContextClass);
    const blob = new Blob(['mock-binary-data'], { type: 'audio/webm' });

    const result = await decoder.decodeTo16kHzMono(blob);

    // Verify context instances created:
    // First context is minimal, used for decoding metadata (1 channel, 1 frame, 16000Hz)
    // Second context is actual sized, used for rendering resampling (1 channel, 32000 frames, 16000Hz)
    const instances = MockOfflineAudioContextClass.instances;
    expect(instances).toHaveLength(2);

    const tempCtx = instances[0];
    expect(tempCtx.numberOfChannels).toBe(1);
    expect(tempCtx.length).toBe(1);
    expect(tempCtx.sampleRate).toBe(16000);
    expect(decodeAudioDataSpy).toHaveBeenCalled();

    const renderCtx = instances[1];
    expect(renderCtx.numberOfChannels).toBe(1);
    expect(renderCtx.sampleRate).toBe(16000);
    // targetLength = Math.round(duration * targetSampleRate) = Math.round(2.0 * 16000) = 32000
    expect(renderCtx.length).toBe(32000);
    
    expect(createBufferSourceSpy).toHaveBeenCalled();
    expect(mockSourceNode.buffer).toBe(mockDecodedBuffer);
    expect(mockSourceNode.connect).toHaveBeenCalledWith(renderCtx.destination);
    expect(mockSourceNode.start).toHaveBeenCalledWith(0);
    expect(startRenderingSpy).toHaveBeenCalled();

    expect(result).toBeInstanceOf(Float32Array);
    expect(result).toEqual(new Float32Array([0.1, -0.1]));
  });

  it('should short-circuit and return channel data directly if audio is already 16kHz mono', async () => {
    // Modify decoded buffer mock to be 16kHz and Mono
    mockDecodedBuffer.sampleRate = 16000;
    mockDecodedBuffer.numberOfChannels = 1;
    const mockChannelData = new Float32Array([0.2, 0.4, 0.6]);
    mockDecodedBuffer.getChannelData.mockReturnValue(mockChannelData);

    const decoder = new BrowserAudioDecoder(MockOfflineAudioContextClass);
    const blob = new Blob(['mock-binary-data'], { type: 'audio/webm' });

    const result = await decoder.decodeTo16kHzMono(blob);

    // Verify only the first context (for decoding metadata) was instantiated
    const instances = MockOfflineAudioContextClass.instances;
    expect(instances).toHaveLength(1);
    expect(decodeAudioDataSpy).toHaveBeenCalled();
    
    // No second rendering context should be created
    expect(result).toBe(mockChannelData);
    expect(mockDecodedBuffer.getChannelData).toHaveBeenCalledWith(0);
  });

  it('should throw CaptureError with DECODING_FAILED if decodeAudioData rejects', async () => {
    const decoder = new BrowserAudioDecoder(MockOfflineAudioContextClass);
    const blob = new Blob(['mock-binary-data'], { type: 'audio/webm' });

    // Mock first context's decodeAudioData to reject
    const mockError = new Error('Invalid format');
    MockOfflineAudioContextClass.prototype.decodeAudioData = jest.fn().mockRejectedValue(mockError);

    await expect(decoder.decodeTo16kHzMono(blob)).rejects.toThrow(CaptureError);
    try {
      await decoder.decodeTo16kHzMono(blob);
    } catch (error) {
      const captureError = error as CaptureError;
      expect(captureError.dto.code).toBe('DECODING_FAILED');
      expect(captureError.dto.message).toContain('Failed to decode audio binary data');
    }
  });

  it('should throw CaptureError with DECODING_FAILED if rendering fails', async () => {
    const decoder = new BrowserAudioDecoder(MockOfflineAudioContextClass);
    const blob = new Blob(['mock-binary-data'], { type: 'audio/webm' });

    // Mock rendering to reject
    const mockError = new Error('Render timeout');
    MockOfflineAudioContextClass.prototype.startRendering = jest.fn().mockRejectedValue(mockError);

    await expect(decoder.decodeTo16kHzMono(blob)).rejects.toThrow(CaptureError);
    try {
      await decoder.decodeTo16kHzMono(blob);
    } catch (error) {
      const captureError = error as CaptureError;
      expect(captureError.dto.code).toBe('DECODING_FAILED');
      expect(captureError.dto.message).toContain('Failed to resample audio data to 16kHz mono');
    }
  });
});
