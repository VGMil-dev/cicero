import React from 'react';
import { useAudioCaptureContext } from '../../contexts/AudioCaptureContext';
import { ProgressBar } from '../atoms/ProgressBar';

/**
 * Organism component rendering the speech analysis in-progress container.
 * Displays a spinning loader and a stripes-animated progress bar when `isAnalyzing` is true.
 * 
 * @example
 * ```tsx
 * <AnalysisStatus />
 * ```
 */
export function AnalysisStatus() {
  const { isAnalyzing } = useAudioCaptureContext();

  if (!isAnalyzing) return null;

  return (
    <div className="mt-8 border-3 border-black rounded-2xl p-6 bg-amber-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none rounded-2xl" />
      <div className="relative z-10 w-full max-w-md py-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] animate-spin">
          <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
          </svg>
        </div>
        <h4 className="font-headline font-bold text-xl mb-2 text-stone-900">Analizando grabación...</h4>
        <p className="text-stone-600 text-sm mb-4">
          Decodificando audio PCM local y procesando con el modelo de voz...
        </p>
        <ProgressBar progress={70} className="w-full" heightClass="h-6" />
      </div>
    </div>
  );
}
