import { useState, useEffect, useMemo } from 'react';

/**
 * Hook to simulate audio waveform heights when recording is active.
 *
 * @param isActive - True if recording is active and heights should fluctuate.
 * @returns Array of numbers representing heights (in percentages).
 * @example
 * ```typescript
 * const waveHeights = useWaveform(state === 'recording');
 * ```
 */
export function useWaveform(isActive: boolean): number[] {
  const [rawWaveHeights, setRawWaveHeights] = useState<number[]>([]);

  const defaultWave = useMemo(() => [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], []);

  const waveHeights = useMemo(() => {
    if (!isActive) {
      return defaultWave;
    }
    return rawWaveHeights.length > 0 ? rawWaveHeights : defaultWave;
  }, [isActive, rawWaveHeights, defaultWave]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setRawWaveHeights(
        Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 8)
      );
    }, 120);
    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  return waveHeights;
}
