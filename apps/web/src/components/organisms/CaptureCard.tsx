import React from 'react';
import { useAudioCaptureContext } from '../../contexts/AudioCaptureContext';
import { useTimer } from '../../hooks/useTimer';
import { ProgressBar } from '../atoms/ProgressBar';
import { WaveformVisualizer } from '../molecules/WaveformVisualizer';

/**
 * Organism component rendering the interactive capture card.
 * Orchestrates user views depending on the active state:
 * 
 * - `idle`: Prompt to initialize speech model.
 * - `loading-model`: Neo-Brutalist loading feedback with stage indicator.
 * - `ready`: Call-to-action button to initiate recording.
 * - `recording`: Visual timer, animated waveform, and termination actions.
 * - `error`: Technical error box with re-initialization actions.
 * 
 * @example
 * ```tsx
 * <CaptureCard />
 * ```
 */
export function CaptureCard() {
  const {
    state,
    progress,
    error,
    initializeModel,
    startRecording,
    stopRecording,
    cancelRecording,
    terminateWorker,
  } = useAudioCaptureContext();

  const isRecording = state === 'recording';
  const { formatTime } = useTimer(isRecording);

  const handleStartRecording = async () => {
    await startRecording();
  };

  return (
    <div className={`border-3 border-black rounded-2xl p-6 md:p-8 relative z-10 min-h-[300px] flex flex-col justify-between transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,1)]
      ${state === 'idle' ? 'bg-[#faf9f6]' : ''}
      ${state === 'loading-model' ? 'bg-amber-50/70' : ''}
      ${state === 'ready' ? 'bg-emerald-50/50' : ''}
      ${state === 'recording' ? 'bg-rose-50/70 border-red-500 shadow-[4px_4px_0px_rgba(239,68,68,1)]' : ''}
      ${state === 'error' ? 'bg-rose-100/50' : ''}
    `}>
      {/* Notebook grid line background for the card */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none rounded-2xl" />

      {/* CARD CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-4">

        {/* 1. STATE: IDLE */}
        {state === 'idle' && (
          <div className="max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <svg className="w-8 h-8 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </div>
            <h3 className="font-headline font-bold text-2xl mb-2">Punto de Partida</h3>
            <p className="text-stone-600 mb-6 text-sm">
              El componente de grabación está listo pero el modelo aún no se ha inicializado en segundo plano.
            </p>
            <button
              onClick={initializeModel}
              className="px-6 py-3 bg-neon-green text-black font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-sm cursor-pointer"
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-black flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Inicializar Modelo
              </span>
            </button>
          </div>
        )}

        {/* 2. STATE: LOADING MODEL */}
        {state === 'loading-model' && (
          <div className="w-full max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] animate-bounce">
              <svg className="w-8 h-8 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" />
                <line x1="16" y1="16" x2="16" y2="16" />
              </svg>
            </div>
            <h3 className="font-headline font-bold text-2xl mb-2">Cargando Modelo IA</h3>
            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-6 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full inline-block">
              Etapa: {progress?.stage || 'Descargando...'}
            </p>

            <ProgressBar progress={progress?.progress || 0} showText className="mb-4" />

            <p className="text-stone-600 mt-4 text-xs font-semibold italic max-w-sm mx-auto">
              {progress?.message || 'Descargando archivos del modelo en IndexedDB y montando Web Worker...'}
            </p>
          </div>
        )}

        {/* 3. STATE: READY */}
        {state === 'ready' && (
          <div className="max-w-md">
            <h3 className="font-headline font-bold text-3xl mb-4 text-black">¡Modelo de Voz Listo!</h3>
            <p className="text-stone-600 mb-8 text-sm">
              El modelo de IA está completamente cargado en memoria local. Presiona el botón para iniciar la captura de voz de manera 100% privada.
            </p>
            <button
              onClick={handleStartRecording}
              className="w-24 h-24 mx-auto flex items-center justify-center bg-neon-green text-black border-3 border-black rounded-full shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[9px_9px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
              title="Iniciar Grabación"
            >
              <svg className="w-10 h-10 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" x2="12" y1="19" y2="22" />
                <line x1="8" x2="16" y1="22" y2="22" />
              </svg>
            </button>
            <span className="block mt-4 font-headline font-bold text-xs uppercase tracking-wider text-stone-500">
              PRESIONA PARA GRABAR
            </span>
          </div>
        )}

        {/* 4. STATE: RECORDING */}
        {state === 'recording' && (
          <div className="w-full max-w-lg">
            <div className="font-headline font-extrabold text-5xl md:text-6xl text-red-500 tracking-wider mb-6 flex items-center justify-center gap-3">
              <span className="inline-block w-4 h-4 rounded-full bg-red-500 animate-ping" />
              {formatTime()}
            </div>

            <h3 className="font-headline font-bold text-xl mb-4 text-stone-700">Capturando voz...</h3>

            <WaveformVisualizer isActive={isRecording} />

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={stopRecording}
                className="px-6 py-4 bg-red-500 text-white font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 uppercase tracking-wide text-sm cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Terminar Grabación
              </button>

              <button
                onClick={cancelRecording}
                className="px-5 py-4 bg-stone-100 text-stone-800 font-bold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* 5. STATE: ERROR */}
        {state === 'error' && (
          <div className="max-w-md w-full">
            <div className="w-16 h-16 mx-auto mb-4 bg-rose-200 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] text-red-700">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-headline font-bold text-2xl mb-2 text-stone-900">Se produjo un error</h3>

            <div className="border-2 border-black bg-rose-50 text-left p-4 rounded-xl mb-6 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <p className="font-headline font-bold text-xs uppercase text-red-600 mb-1">
                Código: {error?.code || 'UNKNOWN'}
              </p>
              <p className="text-stone-700 text-sm font-medium">
                {error?.message || 'Ha ocurrido un error inesperado en el flujo de hardware o procesamiento.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={initializeModel}
                className="px-5 py-3 bg-stone-900 text-white font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
                </svg>
                <span>Reintentar</span>
              </button>
              <button
                onClick={terminateWorker}
                className="px-5 py-3 bg-red-400 text-black font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-black flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14a2 2 0 0 0 1.73 3h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>IA Reset</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
