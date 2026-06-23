import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ModelBootstrap } from '../core/SpeechToText/ModelBootstrap.port';
import { AudioRecorder } from '../core/Recorder/AudioRecorder.port';
import { AudioDecoder } from '../core/AudioDecoder/AudioDecoder.port';
import { SpeechAnalyzer } from '../core/SpeechToText/SpeechAnalyzer.port';
import { CalculateScoreUseCase } from '../core/OratoryAnalysis/CalculateScore.port';
import { FakeAudioModelBootstrap } from '../core/SpeechToText/ModelBootstrap.mock';
import { FakeAudioRecorder } from '../core/Recorder/AudioRecorder.mock';
import { FakeAudioDecoder } from '../core/AudioDecoder/AudioDecoder.mock';
import { FakeAudioAnalyzer } from '../core/SpeechToText/SpeechAnalyzer.mock';
import { WorkerModelBootstrap } from '../core/SpeechToText/WorkerModelBootstrap.adapter';
import { BrowserAudioRecorder } from '../core/Recorder/BrowserAudioRecorder.adapter';
import { BrowserAudioDecoder } from '../core/AudioDecoder/BrowserAudioDecoder.adapter';
import { TransformersSpeechAnalyzer } from '../core/SpeechToText/TransformersSpeechAnalyzer.adapter';
import { DefaultCalculateScoreUseCase } from '../core/OratoryAnalysis/CalculateScore.usecase';

/**
 * Interface representing the properties exposed by the Dependency Injection Context.
 * Acts as the Composition Root (DI Container) for Cicero's port/adapter architecture.
 */
export interface DIContextProps {
  /** The adapter for bootstrapping the speech model, conforming to {@link ModelBootstrap} */
  bootstrap: ModelBootstrap;
  /** The adapter for recording audio, conforming to {@link AudioRecorder} */
  recorder: AudioRecorder;
  /** The adapter for decoding audio files, conforming to {@link AudioDecoder} */
  decoder: AudioDecoder;
  /** The adapter for speech transcription/inference, conforming to {@link SpeechAnalyzer} */
  analyzer: SpeechAnalyzer;
  /** The use case for calculating fluency scores, conforming to {@link CalculateScoreUseCase} */
  calculateScoreUseCase: CalculateScoreUseCase;
  /** Whether the system is currently using real production adapters instead of mocks */
  useRealImplementation: boolean;
  /**
   * Updates the implementation mode (real vs mock).
   * Automatically re-instantiates dependencies and cleans up previous instances.
   * 
   * @param useReal - True to use real adapters, false for mocks.
   */
  setUseRealImplementation: (useReal: boolean) => void;
}

const DIContext = createContext<DIContextProps | null>(null);

/**
 * Provider component for Dependency Injection.
 * Instantiates the appropriate infrastructure adapters (Mock or Real) based on environment configuration.
 *
 * @example
 * ```tsx
 * <DIProvider>
 *   <App />
 * </DIProvider>
 * ```
 */
export function DIProvider({ children }: { children: React.ReactNode }) {
  const [useRealImplementation, setUseRealImplementationState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('use_mocks') !== 'true';
    }
    return true;
  });

  const setUseRealImplementation = (useReal: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('use_mocks', (!useReal).toString());
    }
    setUseRealImplementationState(useReal);
  };

  const bootstrap = useMemo(() => {
    if (useRealImplementation) {
      return new WorkerModelBootstrap({ quantized: true });
    }
    return new FakeAudioModelBootstrap({
      shouldFail: false,
      progressInterval: 400,
    });
  }, [useRealImplementation]);

  const recorder = useMemo(() => {
    if (useRealImplementation) {
      return new BrowserAudioRecorder();
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
    if (useRealImplementation) {
      return new TransformersSpeechAnalyzer(bootstrap, decoder);
    }
    return new FakeAudioAnalyzer({
      delayMs: 1000,
    });
  }, [useRealImplementation, bootstrap, decoder]);

  const calculateScoreUseCase = useMemo(() => {
    return new DefaultCalculateScoreUseCase();
  }, []);

  // Clean up Web Worker on unmount or when implementation changes
  useEffect(() => {
    return () => {
      bootstrap.terminate();
    };
  }, [bootstrap]);

  const value = useMemo(
    () => ({
      bootstrap,
      recorder,
      decoder,
      analyzer,
      calculateScoreUseCase,
      useRealImplementation,
      setUseRealImplementation,
    }),
    [bootstrap, recorder, decoder, analyzer, calculateScoreUseCase, useRealImplementation]
  );

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
}

/**
 * Hook to consume the DI Context.
 * Ensures dependencies are resolved within a valid DIProvider.
 *
 * @returns The resolved dependencies conforming to {@link DIContextProps}.
 */
export function useDI(): DIContextProps {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDI must be used within a DIProvider');
  }
  return context;
}
