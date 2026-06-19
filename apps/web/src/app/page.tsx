"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { FakeAudioModelBootstrap, FakeAudioRecorder, FakeAudioDecoder } from '../core/ports/audio/mocks';
import { WorkerAudioModelBootstrap } from '../core/adapters/audio/WorkerAudioModelBootstrap';
import { BrowserMediaRecorder } from '../core/adapters/audio/BrowserMediaRecorder';
import { BrowserAudioDecoder } from '../core/adapters/audio/BrowserAudioDecoder';
import { FakeAudioAnalyzer } from '../core/ports/audio/mocks/FakeAudioAnalyzer';
import { CalculateScoreUseCase } from '../core/usecases/CalculateScoreUseCase';
import { useAudioCapture } from '../hooks/useAudioCapture';

export default function Home() {
  // Mode configuration: real or mock implementation
  // By default, we use the real implementation for the MVP.
  // Fallback to mocks can be activated by setting 'use_mocks' to 'true' in localStorage.
  const [useRealImplementation] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('use_mocks') !== 'true';
    }
    return true;
  });

  // Re-instantiate based on mode (Real or Mock)
  const bootstrap = useMemo(() => {
    if (useRealImplementation) {
      return new WorkerAudioModelBootstrap({ quantized: true });
    }
    return new FakeAudioModelBootstrap({
      shouldFail: false,
      progressInterval: 400,
    });
  }, [useRealImplementation]);

  const recorder = useMemo(() => {
    if (useRealImplementation) {
      return new BrowserMediaRecorder();
    }
    return new FakeAudioRecorder({
      grantPermission: true,
      shouldFailOnStart: false,
    });
  }, [useRealImplementation]);

  const decoder = useMemo(() => {
    if (useRealImplementation) {
      return new BrowserAudioDecoder();
    }
    return new FakeAudioDecoder();
  }, [useRealImplementation]);

  const analyzer = useMemo(() => {
    return new FakeAudioAnalyzer({
      delayMs: useRealImplementation ? 2000 : 1000,
    });
  }, [useRealImplementation]);

  const calculateScoreUseCase = useMemo(() => {
    return new CalculateScoreUseCase();
  }, []);

  // Hook orchestration
  const {
    state,
    progress,
    error,
    audioBlob,
    isAnalyzing,
    scoreResult,
    initializeModel,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    terminateWorker,
  } = useAudioCapture(bootstrap, recorder, decoder, analyzer, calculateScoreUseCase);

  // Auto-start model loading on mount or when bootstrap changes
  useEffect(() => {
    initializeModel();
  }, [initializeModel]);

  // Limpieza del Web Worker al desmontar
  useEffect(() => {
    return () => {
      bootstrap.terminate();
    };
  }, [bootstrap]);

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



  return (
    <main className="flex-1 w-full min-h-screen bg-[#f5f4f0] p-6 md:p-12 font-body relative overflow-x-hidden bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Decorative Pencil Line Header */}
      <header className="max-w-3xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-6">
        <div>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl uppercase tracking-tight text-black flex items-center gap-3">
            🎙️ Cicero <span className="bg-neon-green text-black border-2 border-black text-xs px-2 py-1 font-body normal-case font-bold rotate-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">MVP</span>
          </h1>
          <p className="text-stone-600 mt-2 text-lg font-medium">
            Carga de Modelo de Voz local en segundo plano y captura privada de audio.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-amber-100 text-stone-800 border-2 border-black text-xs font-semibold px-3 py-1 rounded-full -rotate-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            Estética Doodle Neo-Brutalista
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* Main Interactive Workspace */}
        <section className="w-full bg-white border-4 border-black rounded-[2rem] p-8 md:p-12 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
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
                className="px-3 py-1.5 border-2 border-black rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
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
                      El componente de grabación está listo pero el modelo aún no se ha inicializado en segundo plano.
                    </p>
                    <button
                      onClick={initializeModel}
                      className="px-6 py-3 bg-neon-green text-black font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-sm cursor-pointer"
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
                        className="h-full bg-neon-green border-r-3 border-black transition-all duration-300 animate-stripes"
                        style={{ width: `${progress?.progress || 0}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center font-headline font-extrabold text-sm text-black">
                        {progress?.progress || 0}%
                      </span>
                    </div>
                    
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
                  <div className="max-w-md w-full">
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

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={initializeModel}
                        className="px-5 py-3 bg-stone-900 text-white font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        🔄 Reintentar
                      </button>
                      <button
                        onClick={terminateWorker}
                        className="px-5 py-3 bg-red-400 text-black font-extrabold border-3 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        🚨 IA Reset
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Loading Analysis state */}
            {isAnalyzing && (
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
                  <div className="w-full h-6 bg-white border-3 border-black rounded-xl overflow-hidden relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <div className="h-full bg-neon-green border-r-3 border-black animate-stripes w-[70%]" />
                  </div>
                </div>
              </div>
            )}

            {/* Score Results Dashboard */}
            {scoreResult && !isAnalyzing && (
              <div className="mt-8 border-3 border-black bg-white rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden bg-[radial-gradient(#000000_1px,transparent_0)] bg-[size:20px_20px]">
                <div className="absolute top-0 left-0 right-0 h-3 bg-neon-green border-b-3 border-black" />
                
                <div className="flex flex-col md:flex-row md:items-start gap-6 mt-4 relative z-10">
                  
                  {/* Left Column: Metrics */}
                  <div className="w-full md:w-1/3 flex flex-col gap-4">
                    {/* Score Card */}
                    <div className="border-3 border-black bg-[#E1E1F5] rounded-xl p-4 text-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      <span className="font-headline font-extrabold uppercase text-xs text-stone-600 block mb-1">
                        Limpieza de Oratoria
                      </span>
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neon-green border-3 border-black font-headline font-extrabold text-3xl shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-3 my-2">
                        {scoreResult.metrics.overallScore}%
                      </div>
                      <p className="text-xs font-semibold text-stone-700 mt-2">
                        {scoreResult.metrics.overallScore >= 90
                          ? '🏆 ¡Excelente fluidez!'
                          : scoreResult.metrics.overallScore >= 75
                          ? '👍 Buena comunicación'
                          : '⚠️ Podés mejorar la fluidez'}
                      </p>
                    </div>

                    {/* WPM Card */}
                    <div className="border-3 border-black bg-white rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      <span className="font-headline font-extrabold uppercase text-xs text-stone-500 block mb-1">
                        Velocidad (WPM)
                      </span>
                      <div className="font-headline font-extrabold text-3xl text-black">
                        {scoreResult.metrics.wordsPerMinute} <span className="text-sm font-bold text-stone-500">palabras/min</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border border-black inline-block shadow-[1px_1px_0px_rgba(0,0,0,1)]
                          ${scoreResult.metrics.wordsPerMinute >= 110 && scoreResult.metrics.wordsPerMinute <= 150
                            ? 'bg-emerald-300'
                            : 'bg-amber-300'
                          }`}
                        />
                        <span className="text-xs font-semibold text-stone-600">
                          {scoreResult.metrics.wordsPerMinute >= 110 && scoreResult.metrics.wordsPerMinute <= 150
                            ? 'Velocidad Óptima (110-150)'
                            : scoreResult.metrics.wordsPerMinute < 110
                            ? 'Ritmo pausado (<110)'
                            : 'Ritmo rápido (>150)'}
                        </span>
                      </div>
                    </div>

                    {/* Filler Words Breakdown Card */}
                    <div className="border-3 border-black bg-white rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex-1">
                      <span className="font-headline font-extrabold uppercase text-xs text-stone-500 block mb-2">
                        Desglose de Muletillas ({scoreResult.metrics.fillerWordsCount})
                      </span>
                      {scoreResult.metrics.fillerWordsCount > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(scoreResult.metrics.fillerWordsBreakdown).map(([word, count]) => (
                            <span
                              key={word}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black rounded-lg bg-[#FFDAD6] text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] -rotate-1"
                            >
                              <code className="text-stone-900 font-extrabold">{word}</code>
                              <span className="bg-white border border-black rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                                {count}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic">¡No se detectaron muletillas en el audio!</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Verbatim Transcription */}
                  <div className="w-full md:w-2/3 border-3 border-black bg-white rounded-xl p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] min-h-[250px] flex flex-col">
                    <h5 className="font-headline font-bold text-sm uppercase text-stone-500 mb-4 border-b-2 border-black pb-2 flex items-center justify-between">
                      <span>📝 Transcripción del Discurso</span>
                      <span className="bg-stone-100 text-stone-800 border border-black text-[10px] px-2 py-0.5 rounded font-bold uppercase shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                        Verbatim
                      </span>
                    </h5>
                    <div className="flex flex-wrap gap-x-2 gap-y-3 text-lg font-semibold leading-relaxed text-stone-850 flex-1 content-start">
                      {scoreResult.chunks.map((chunk, idx) => {
                        if (chunk.isFillerWord) {
                          return (
                            <span
                              key={idx}
                              className="inline-block bg-[#FFDAD6] text-red-950 border-2 border-black px-1.5 py-0.5 rounded-md font-extrabold rotate-[-1deg] shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 hover:rotate-1"
                              title={`Muletilla detectada (${chunk.start.toFixed(1)}s - ${chunk.end.toFixed(1)}s)`}
                            >
                              {chunk.word}
                            </span>
                          );
                        }
                        return (
                          <span
                            key={idx}
                            className="inline-block text-stone-850 transition-colors hover:text-black py-0.5"
                            title={`${chunk.start.toFixed(1)}s - ${chunk.end.toFixed(1)}s`}
                          >
                            {chunk.word}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
