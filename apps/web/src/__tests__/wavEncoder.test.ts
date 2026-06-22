import { encodePCMToWAV } from '../core/adapters/audio/wavEncoder';

// Helper to convert Blob to ArrayBuffer using FileReader (for compatibility in JSDOM)
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Result is not an ArrayBuffer'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('FileReader error'));
    };
    reader.readAsArrayBuffer(blob);
  });
}

describe('wavEncoder Unit Tests', () => {
  it('should encode PCM data to a valid WAV Blob format', async () => {
    // Generate a simple PCM Float32Array
    const pcm = new Float32Array([0.0, 1.0, -1.0, 0.5, -0.5]);
    const sampleRate = 16000;
    
    const blob = encodePCMToWAV(pcm, sampleRate);
    
    // Check blob properties
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + pcm.length * 2); // 44 bytes header + 5 samples * 2 bytes = 54 bytes
    
    // Convert blob to array buffer to inspect header fields
    const arrayBuffer = await readBlobAsArrayBuffer(blob);
    const view = new DataView(arrayBuffer);
    
    // Helper to read string
    const readString = (offset: number, length: number): string => {
      let str = '';
      for (let i = 0; i < length; i++) {
        str += String.fromCharCode(view.getUint8(offset + i));
      }
      return str;
    };
    
    // Check RIFF header
    expect(readString(0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + pcm.length * 2);
    expect(readString(8, 4)).toBe('WAVE');
    
    // Check fmt chunk
    expect(readString(12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16); // Chunk size
    expect(view.getUint16(20, true)).toBe(1);  // PCM format
    expect(view.getUint16(22, true)).toBe(1);  // Mono channel
    expect(view.getUint32(24, true)).toBe(sampleRate);
    expect(view.getUint32(28, true)).toBe(sampleRate * 2); // Byte rate
    expect(view.getUint16(32, true)).toBe(2);  // Block align
    expect(view.getUint16(34, true)).toBe(16); // Bits per sample
    
    // Check data chunk
    expect(readString(36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(pcm.length * 2);
    
    // Check sample conversions
    // Sample 0: 0.0 -> 0
    expect(view.getInt16(44, true)).toBe(0);
    // Sample 1: 1.0 -> 32767
    expect(view.getInt16(46, true)).toBe(32767);
    // Sample 2: -1.0 -> -32768
    expect(view.getInt16(48, true)).toBe(-32768);
  });

  it('should clip out-of-bound PCM samples gracefully', async () => {
    const pcm = new Float32Array([1.5, -2.0]);
    const blob = encodePCMToWAV(pcm, 16000);
    const arrayBuffer = await readBlobAsArrayBuffer(blob);
    const view = new DataView(arrayBuffer);
    
    // Clip positive value to 32767
    expect(view.getInt16(44, true)).toBe(32767);
    // Clip negative value to -32768
    expect(view.getInt16(46, true)).toBe(-32768);
  });
});
