import { TransformersEngine } from '../core/adapters/audio/TransformersEngine';
import { pipeline } from '@huggingface/transformers';

jest.mock('@huggingface/transformers', () => ({
  pipeline: jest.fn(),
}));

describe('TransformersEngine Unit Tests', () => {
  let mockPipeline: jest.Mock;

  beforeEach(() => {
    mockPipeline = jest.fn();
    (pipeline as jest.Mock).mockReset();
    (pipeline as jest.Mock).mockResolvedValue(mockPipeline);
  });

  it('should initialize the pipeline with correct parameters', async () => {
    const engine = new TransformersEngine();
    const progressCallback = jest.fn();
    
    await engine.initialize('test-model', {
      device: 'webgpu',
      dtype: 'q8',
      progress_callback: progressCallback,
    });

    expect(pipeline).toHaveBeenCalledWith('automatic-speech-recognition', 'test-model', {
      device: 'webgpu',
      dtype: 'q8',
      progress_callback: progressCallback,
    });
  });

  it('should execute infer and return correct TranscriptionResultDTO', async () => {
    const engine = new TransformersEngine();
    await engine.initialize('test-model', { device: 'wasm', dtype: 'fp32' });

    // Mock pipeline output
    const mockOutput = {
      text: 'hello world',
      chunks: [
        { text: 'hello', timestamp: [0.0, 0.5] },
        { text: 'world', timestamp: [0.5, 1.0] },
      ],
    };
    mockPipeline.mockResolvedValue(mockOutput);

    const audioData = new Float32Array([1, 2, 3]);
    const result = await engine.infer(audioData);

    expect(mockPipeline).toHaveBeenCalledWith(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: 'word',
      language: 'spanish',
      task: 'transcribe',
    });

    expect(result).toEqual({
      text: 'hello world',
      chunks: [
        { word: 'hello', start: 0.0, end: 0.5 },
        { word: 'world', start: 0.5, end: 1.0 },
      ],
    });
  });

  it('should handle missing chunks or invalid formats in infer gracefully', async () => {
    const engine = new TransformersEngine();
    await engine.initialize('test-model', { device: 'wasm', dtype: 'fp32' });

    mockPipeline.mockResolvedValue({ text: 'just text' }); // no chunks

    const result = await engine.infer(new Float32Array([1]));
    expect(result).toEqual({
      text: 'just text',
      chunks: [],
    });
  });

  it('should throw error if infer is called before initialize', async () => {
    const engine = new TransformersEngine();
    await expect(engine.infer(new Float32Array([1]))).rejects.toThrow(
      'TransformersEngine is not initialized'
    );
  });

  it('should propagate errors from pipeline execution', async () => {
    const engine = new TransformersEngine();
    await engine.initialize('test-model', { device: 'wasm', dtype: 'fp32' });
    
    mockPipeline.mockRejectedValue(new Error('CUDA out of memory'));

    await expect(engine.infer(new Float32Array([1]))).rejects.toThrow(
      'Inference execution failed: CUDA out of memory'
    );
  });
});
