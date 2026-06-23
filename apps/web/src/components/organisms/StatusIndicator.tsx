import React from 'react';
import { useAudioCaptureContext } from '../../contexts/AudioCaptureContext';
import { useDI } from '../../contexts/DIContext';
import { Button } from '../atoms/Button';

/**
 * Organism component rendering the application status bar and control toggles.
 * Exposes a button to reset the current session and a mode toggle to switch
 * between real production WebAssembly AI execution and mock simulation modes.
 * 
 * @example
 * ```tsx
 * <StatusIndicator />
 * ```
 */
export function StatusIndicator() {
  const { state, reset } = useAudioCaptureContext();
  const { useRealImplementation, setUseRealImplementation } = useDI();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-headline font-bold uppercase text-xs text-stone-500">Estado actual:</span>
          <span className={`inline-flex items-center px-3 py-1 text-sm font-bold border-2 border-black rounded-full uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] gap-1.5
            ${state === 'idle' ? 'bg-stone-200 text-black' : ''}
            ${state === 'loading-model' ? 'bg-amber-300 text-black animate-pulse' : ''}
            ${state === 'ready' ? 'bg-emerald-300 text-black' : ''}
            ${state === 'recording' ? 'bg-red-400 text-white animate-pulse' : ''}
            ${state === 'error' ? 'bg-rose-400 text-black' : ''}
          `}>
            {state === 'idle' && (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
                Inactivo
              </>
            )}
            {state === 'loading-model' && (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
                </svg>
                Cargando Modelo
              </>
            )}
            {state === 'ready' && (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Modelo Listo
              </>
            )}
            {state === 'recording' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping inline-block" />
                Grabando Voz
              </>
            )}
            {state === 'error' && (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                </svg>
                Error
              </>
            )}
          </span>
        </div>

        {/* Mode Toggle Button */}
        <Button
          variant="ghost"
          onClick={() => setUseRealImplementation(!useRealImplementation)}
          className={`text-xs ${
            useRealImplementation ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-950' : 'bg-amber-100 hover:bg-amber-200 text-amber-950'
          }`}
          title={useRealImplementation ? "Cambiar a modo simulación (Mock)" : "Cambiar a modo producción (WASM)"}
        >
          {useRealImplementation ? 'Modo: REAL (WASM)' : 'Modo: MOCK'}
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={reset}
        className="text-xs"
        title="Reiniciar flujo"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
        </svg>
        Reiniciar
      </Button>
    </div>
  );
}
