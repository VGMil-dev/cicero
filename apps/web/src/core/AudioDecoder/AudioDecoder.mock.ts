import { AudioDecoder } from './AudioDecoder.port';

/**
 * Fake implementation of {@link AudioDecoder} for testing and UI prototyping.
 * Simulates decoding audio blobs by returning a dummy Float32Array without Web Audio API calls.
 */
export class FakeAudioDecoder implements AudioDecoder {
  /**
   * Simulates decoding an audio blob.
   * 
   * @param _audioBlob - Ignored in the mock.
   * @returns A promise resolving to an empty Float32Array.
   */
  async decodeTo16kHzMono(_audioBlob: Blob): Promise<Float32Array> {
    return Promise.resolve(new Float32Array(16000));
  }
}
