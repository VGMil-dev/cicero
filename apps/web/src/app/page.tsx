"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { FakeAudioModelBootstrap, FakeAudioRecorder } from '../core/ports/audio/mocks';
import { WorkerAudioModelBootstrap } from '../core/adapters/audio/WorkerAudioModelBootstrap';
import { BrowserMediaRecorder } from '../core/adapters/audio/BrowserMediaRecorder';
import { useAudioCapture } from '../hooks/useAudioCapture';

export default function Home() {
  // Mode configuration: real or mock implementation
  const [useRealImplementation, setUseRealImplementation] = useState(true);

  // Mock configuration options
  const [shouldFailModel, setShouldFailModel] = useState(false);
  const [grantPermission, setGrantPermission] = useState(true);
  const [shouldFailOnStart, setShouldFailOnStart] = useState(false);
  const progressInterval = 400; // 400ms for quick but visible progress

  // Re-instantiate based on mode (Real or Mock)
  const bootstrap = useMemo(() => {
    if (useRealImplementation) {
      return new WorkerAudioModelBootstrap({ quantized: true });
    }
    return new FakeAudioModelBootstrap({
      shouldFail: shouldFailModel,
      progressInterval: progressInterval,
    });
  }, [useRealImplementation, shouldFailModel]);

  const recorder = useMemo(() => {
    if (useRealImplementation) {
      return new BrowserMediaRecorder();
    }
    return new FakeAudioRecorder({
      grantPermission: grantPermission,
      shouldFailOnStart: shouldFailOnStart,
    });
  }, [useRealImplementation, grantPermission, shouldFailOnStart]);

  // Hook orchestration
  const {
    state,
    progress,
    error,
    audioBlob,
    initializeModel,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  } = useAudioCapture(bootstrap, recorder);

  // Auto-start model loading on mount or when bootstrap changes
  useEffect(() => {
    initializeModel();
  }, [initializeModel]);

  // Limpieza del Web Worker al desmontar o cambiar la implementación
  useEffect(() => {
    return () => {
      if (bootstrap && 'terminate' in bootstrap) {
        (bootstrap as any).terminate();
      }
    };
  }, [bootstrap]);

  // Escuchar pánicos del Web Worker a nivel de UI para diagnóstico
  useEffect(() => {
    if (!(bootstrap instanceof WorkerAudioModelBootstrap)) return;

    const worker = bootstrap.getWorkerInstance();
    if (!worker) return;

    const handleFatalError = (e: ErrorEvent) => {
      console.error("Crash fatal capturado en UI desde Web Worker:", e);
    };

    worker.addEventListener('error', handleFatalError);
    return () => {
      worker.removeEventListener('error', handleFatalError);
    };
  }, [bootstrap, state]);

  // Recording timer
  const [recordingTime, setRecordingTime] = useState(0);
  useEffect(() => {
    if (state !== 'recording') return;
    const interval = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [state]);

  const handleStartRecording = async () => {
    setRecordingTime(0);
    await startRecording();
  };

  const formatTime = (secs: number) => {
    const displayTime = state === 'recording' ? secs : 0;
    const m = Math.floor(displayTime / 60).toString().padStart(2, '0');
    const s = (displayTime % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Simulated audio waveform feedback
  const [rawWaveHeights, setRawWaveHeights] = useState<number[]>([]);
  const waveHeights = useMemo(() => {
    if (state !== 'recording') {
      return [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    }
    return rawWaveHeights.length > 0 ? rawWaveHeights : [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
  }, [state, rawWaveHeights]);

  useEffect(() => {
    if (state !== 'recording') return;
    const interval = setInterval(() => {
      setRawWaveHeights(
        Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 8)
      );
    }, 120);
    return () => {
      clearInterval(interval);
    };
  }, [state]);

  // Dummy analysis for previewing feature 3 (highlighted transcript)
  const dummyTranscript = [
    { word: 'Hola', type: 'normal' },
    { word: 'a', type: 'normal' },
    { word: 'todos,', type: 'normal' },
    { word: 'este...', type: 'filler' },
    { word: 'hoy', type: 'normal' },
    { word: 'quería', type: 'normal' },
    { word: 'hablar', type: 'normal' },
    { word: 'eh...', type: 'filler' },
    { word: 'sobre', type: 'normal' },
    { word: 'el', type: 'normal' },
    { word: 'diseño', type: 'normal' },
    { word: 'brutalista.', type: 'normal' },
  ];

  return (
    <main className="flex-1 w-full min-h-screen bg-[#f5f4f0] p-6 md:p-12 font-body relative overflow-x-hidden bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Decorative Pencil Line Header */}
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-6">
        <div>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl uppercase tracking-tight text-black flex items-center gap-3">
            🎙️ Cicero <span className="bg-neon-green text-black border-2 border-black text-xs px-2 py-1 font-body normal-case font-bold rotate-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">MOCK PLAYGROUND</span>
          </h1>
          <p className="text-stone-600 mt-2 text-lg font-medium">
            Entorno de prueba interactivo para la Carga del Modelo de IA y Grabación local.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-amber-100 text-stone-800 border-2 border-black text-xs font-semibold px-3 py-1 rounded-full -rotate-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            Estética Doodle Neo-Brutalista
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Main Interactive Workspace (8 Cols) */}
        <section className="lg:col-span-8 bg-white border-4 border-black rounded-[2rem] p-8 md:p-12 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Notebook Spiral Decoration */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-6 bg-stone-100 border-r-4 border-black select-none">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center -space-x-1">
                <div className="w-4 h-2 bg-stone-300 rounded-full border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.5)]" />
                <div className="w-2 h-2 rounded-full bg-stone-800" />
              </div>
            ))}
          </div>

          {/* Main Content Area (indented for margins) */}
          <div className="pl-6 md:pl-10">
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold uppercase text-xs text-stone-500">Estado actual:</span>
                <span className={`inline-flex items-center px-3 py-1 text-sm font-bold border-2 border-black rounded-full uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]
                  ${state === 'idle' ? 'bg-stone-200 text-black' : ''}
                  ${state === 'loading-model' ? 'bg-amber-300 text-black animate-pulse' : ''}
                  ${state === 'ready' ? 'bg-emerald-300 text-black' : ''}
                  ${state === 'recording' ? 'bg-red-400 text-white animate-pulse' : ''}
                  ${state === 'error' ? 'bg-rose-400 text-black' : ''}
                `}>
                  {state === 'idle' && '💤 Inactivo'}
                  {state === 'loading-model' && '🤖 Cargando Modelo'}
                  {state === 'ready' && '✅ Modelo Listo'}
                  {state === 'recording' && '🔴 Grabando Voz'}
                  {state === 'error' && '⚠️ Error'}
                </span>
              </div>
              <button
                onClick={reset}
                className="px-3 py-1.5 border-2 border-black rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5"
                title="Reiniciar flujo"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
                </svg>
                Reiniciar
              </button>
            </div>

            {/* Simulated UI container */}
            <div className={`border-3 border-black rounded-2xl p-6 md:p-8 relative min-h-[300px] flex flex-col justify-between transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,1)]
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
                      <span className="text-3xl">💤</span>
                    </div>
                    <h3 className="font-headline font-bold text-2xl mb-2">Punto de Partida</h3>
                    <p className="text-stone-600 mb-6 text-sm">
                      El componente de grabación está montado pero el modelo aún no se ha inicializado en segundo plano.
                    </p>
                    <button
                      onClick={initializeModel}
                      className="px-6 py-3 bg-neon-green text-black font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-sm"
                    >
                      🚀 Inicializar Modelo
                    </button>
                  </div>
                )}

                {/* 2. STATE: LOADING MODEL */}
                {state === 'loading-model' && (
                  <div className="w-full max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] animate-bounce">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <h3 className="font-headline font-bold text-2xl mb-2">Cargando Modelo IA</h3>
                    <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-6 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full inline-block">
                      Etapa: {progress?.stage || 'Descargando...'}
                    </p>

                    {/* Progress Bar (Chunky Neo-Brutalist) */}
                    <div className="w-full h-8 bg-white border-3 border-black rounded-xl overflow-hidden relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      <div
                        className="h-full bg-neon-green border-r-3 border-black transition-all duration-300"
                        style={{ width: `${progress?.progress || 0}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center font-headline font-extrabold text-sm text-black">
                        {progress?.progress || 0}%
                      </span>
                    </div>
                    
                    <p className="text-stone-500 mt-4 text-xs">
                      Descargando CrisperWhisper-ONNX en IndexedDB y montando Web Worker...
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

                    {/* Microphone CTA Button */}
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
                    {/* Time Counter */}
                    <div className="font-headline font-extrabold text-5xl md:text-6xl text-red-500 tracking-wider mb-6 flex items-center justify-center gap-3">
                      <span className="inline-block w-4 h-4 rounded-full bg-red-500 animate-ping" />
                      {formatTime(recordingTime)}
                    </div>

                    <h3 className="font-headline font-bold text-xl mb-4 text-stone-700">Capturando voz...</h3>

                    {/* Audio feedback visualization (wavy bars) */}
                    <div className="h-20 flex items-center justify-center gap-1.5 mb-10 overflow-hidden">
                      {waveHeights.map((h, i) => (
                        <div
                          key={i}
                          className="w-3.5 bg-red-500 border border-black rounded-full transition-all duration-100"
                          style={{
                            height: `${h}%`,
                            boxShadow: '1.5px 1.5px 0px 0px rgba(0,0,0,1)'
                          }}
                        />
                      ))}
                    </div>

                    {/* CTA Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {/* Stop Recording */}
                      <button
                        onClick={stopRecording}
                        className="px-6 py-4 bg-red-500 text-white font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 uppercase tracking-wide text-sm cursor-pointer"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                        Terminar Grabación
                      </button>

                      {/* Cancel Recording */}
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
                  <div className="max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-rose-200 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] text-red-700">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="font-headline font-bold text-2xl mb-2 text-stone-900">Se produjo un error</h3>
                    
                    {/* Error Box */}
                    <div className="border-2 border-black bg-rose-50 text-left p-4 rounded-xl mb-6 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <p className="font-headline font-bold text-xs uppercase text-red-600 mb-1">
                        Código: {error?.code || 'UNKNOWN'}
                      </p>
                      <p className="text-stone-700 text-sm font-medium">
                        {error?.message || 'Ha ocurrido un error inesperado en el flujo de hardware o procesamiento.'}
                      </p>
                    </div>

                    <button
                      onClick={initializeModel}
                      className="px-6 py-3 bg-stone-900 text-white font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-xs"
                    >
                      🔄 Reintentar Inicialización
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Simulated Output / Result Preview */}
            {audioBlob && (
              <div className="mt-8 border-3 border-black rounded-2xl p-6 bg-purple-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="absolute top-2 right-4 text-xs font-bold text-purple-400 rotate-3">MOCK RESULT</div>
                <h4 className="font-headline font-bold text-lg mb-3 flex items-center gap-2">
                  <span>📦</span> Audio Grabado con Éxito
                </h4>
                
                {/* Audio Blob Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold border-2 border-black bg-white p-4 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <div>
                    <span className="text-stone-400 block text-xs">TIPO MIME:</span>
                    <code className="text-purple-600">{audioBlob.type}</code>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-xs">TAMAÑO DEL ARCHIVO:</span>
                    <span className="text-stone-700">{audioBlob.size} bytes</span>
                  </div>
                </div>

                {/* Feature 2 & 3 Preview mockups */}
                <div className="mt-6 border-2 border-dashed border-purple-300 p-4 rounded-xl bg-purple-50/50">
                  <h5 className="font-headline font-bold text-xs uppercase tracking-wider text-purple-700 mb-2">
                    🤖 Vista previa: Transcripción y Detección (Feature 2 & 3)
                  </h5>
                  <p className="text-xs text-stone-500 mb-3">
                    En una integración real, este Blob se enviará al Web Worker y se analizará contra el diccionario de muletillas:
                  </p>
                  <div className="flex flex-wrap gap-2 text-base font-semibold font-body bg-white border-2 border-black p-3 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {dummyTranscript.map((t, idx) => (
                      <span
                        key={idx}
                        className={t.type === 'filler' ? 'bg-rose-200 text-rose-800 border border-rose-400 px-1 py-0.5 rounded rotate-1' : ''}
                      >
                        {t.word}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">
                      Score de Oratoria Esperado:
                    </span>
                    <span className="bg-emerald-300 text-black border border-black text-xs font-extrabold px-2 py-0.5 rounded shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      83.3% Limpieza (2 muletillas)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Mock Simulator Control Panel (4 Cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* post-it notebook card */}
          <div className="bg-[#fffbeb] border-4 border-black rounded-[1.5rem] p-6 relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
            {/* Red header strip */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-amber-200 border-b-4 border-black rounded-t-[1.1rem]" />
            
            <h2 className="font-headline font-extrabold text-xl mb-4 text-black flex items-center gap-2 mt-2">
              ⚙️ Simulador de Mocks
            </h2>
            <p className="text-stone-700 text-xs mb-6 font-medium">
              Ajusta los interruptores para probar cómo reacciona la UI en los diferentes casos de éxito y de error técnico.
            </p>

            <div className="space-y-5">
              {/* Option 0: Real vs Mock Mode */}
              <div className="border-2 border-black p-3 bg-white rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <span className="block font-headline font-bold text-xs uppercase text-stone-500 mb-2">
                  🛠️ Modo de Ejecución
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setUseRealImplementation(true); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${useRealImplementation ? 'bg-neon-green text-black translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Real
                  </button>
                  <button
                    onClick={() => { setUseRealImplementation(false); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${!useRealImplementation ? 'bg-neon-green text-black translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Mock
                  </button>
                </div>
              </div>

              {/* Option 1: Model Load result */}
              <div className={`border-2 border-black p-3 bg-white rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all duration-200 ${useRealImplementation ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className="block font-headline font-bold text-xs uppercase text-stone-500 mb-2">
                  1. Carga de Modelo de IA (Mock)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShouldFailModel(false); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${!shouldFailModel ? 'bg-neon-green text-black translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Carga Exitosa
                  </button>
                  <button
                    onClick={() => { setShouldFailModel(true); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${shouldFailModel ? 'bg-red-400 text-white translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Simular Fallo
                  </button>
                </div>
              </div>

              {/* Option 2: Mic permissions (Mock) */}
              <div className={`border-2 border-black p-3 bg-white rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all duration-200 ${useRealImplementation ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className="block font-headline font-bold text-xs uppercase text-stone-500 mb-2">
                  2. Permisos de Micrófono (Mock)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setGrantPermission(true); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${grantPermission ? 'bg-neon-green text-black translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Concedidos
                  </button>
                  <button
                    onClick={() => { setGrantPermission(false); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${!grantPermission ? 'bg-red-400 text-white translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Denegados
                  </button>
                </div>
              </div>

              {/* Option 3: Recording Failure (Mock) */}
              <div className={`border-2 border-black p-3 bg-white rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all duration-200 ${useRealImplementation ? 'opacity-40 pointer-events-none' : ''}`}>
                <span className="block font-headline font-bold text-xs uppercase text-stone-500 mb-2">
                  3. Error al Iniciar Grabación (Mock)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShouldFailOnStart(false); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${!shouldFailOnStart ? 'bg-neon-green text-black translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Sin Errores
                  </button>
                  <button
                    onClick={() => { setShouldFailOnStart(true); reset(); }}
                    className={`flex-1 py-1.5 text-xs font-extrabold border-2 border-black rounded-md transition-all uppercase
                      ${shouldFailOnStart ? 'bg-red-400 text-white translate-y-[1px] shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    Simular Error
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t-2 border-black border-dashed pt-4">
              <p className="text-stone-500 text-[10px] leading-tight">
                * Nota: Cambiar cualquier ajuste reiniciará la máquina de estados a `idle` y activará la carga con los nuevos mocks de prueba configurados.
              </p>
            </div>
          </div>

          {/* Quick Guide Post-it */}
          <div className="bg-[#e0f2fe] border-4 border-black rounded-[1.5rem] p-6 relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[1.5deg]">
            <h3 className="font-headline font-extrabold text-lg mb-2 text-black">💡 Guía Rápida</h3>
            <ul className="text-xs text-stone-800 space-y-2 list-disc list-inside font-semibold">
              <li>El modelo tarda aproximadamente 2 segundos en cargar por defecto (simulado).</li>
              <li>Puedes detener la grabación en cualquier momento para obtener el Blob del audio.</li>
              <li>Simula un fallo en la carga del modelo para verificar la pantalla de recuperación y reintento de la UI.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
