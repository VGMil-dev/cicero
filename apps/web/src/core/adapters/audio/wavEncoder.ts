/**
 * Utility function to encode raw PCM Float32Array audio data into a standard 16-bit mono WAV Blob.
 * This encoder writes the standard 44-byte RIFF/WAVE header and converts floating-point samples
 * in the range [-1.0, 1.0] to 16-bit signed little-endian integers.
 * 
 * @param pcm - The raw audio data as a {@link Float32Array} (normally sampled at 16kHz).
 * @param sampleRate - The sampling rate of the audio in Hz. Defaults to 16000.
 * @returns A {@link Blob} containing the encoded WAV audio data with MIME type 'audio/wav'.
 * 
 * @example
 * ```typescript
 * const pcm = new Float32Array([0.0, 0.5, -0.5, 0.9]);
 * const wavBlob = encodePCMToWAV(pcm, 16000);
 * console.log('WAV blob size:', wavBlob.size); // should be 44 + 4*2 = 52 bytes
 * ```
 */
export function encodePCMToWAV(pcm: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + pcm.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count (mono = 1) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, pcm.length * 2, true);

  // Write PCM audio samples (convert Float32 to 16-bit Int)
  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Writes an ASCII string to a DataView starting at the specified offset.
 * 
 * @param view - The target {@link DataView}.
 * @param offset - The byte offset to start writing at.
 * @param string - The string to write.
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
