import React from 'react';
import { useWaveform } from '../../hooks/useWaveform';

/**
 * Properties for the WaveformVisualizer component, {@link WaveformVisualizer}.
 */
export interface WaveformVisualizerProps {
  /** True if the waveform heights should actively fluctuate */
  isActive: boolean;
}

/**
 * Molecule component rendering the fluctuating audio capture waveform.
 * Utilizes the {@link useWaveform} hook to animate.
 * 
 * @example
 * ```tsx
 * <WaveformVisualizer isActive={state === 'recording'} />
 * ```
 */
export function WaveformVisualizer({ isActive }: WaveformVisualizerProps) {
  const waveHeights = useWaveform(isActive);

  return (
    <div className="h-20 flex items-center justify-center gap-1.5 mb-10 overflow-hidden">
      {waveHeights.map((h, i) => (
        <div
          key={i}
          className="w-3.5 bg-red-500 border border-black rounded-full transition-all duration-100"
          style={{
            height: `${h}%`,
            boxShadow: '1.5px 1.5px 0px 0px rgba(0,0,0,1)',
          }}
        />
      ))}
    </div>
  );
}
