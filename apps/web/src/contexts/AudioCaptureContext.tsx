import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useDI } from './DIContext';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { AudioCaptureState, ErrorDTO } from '../core/shared/types';
import { ProgressDTO } from '../core/SpeechToText/types';
import { ScoreResult } from '../core/OratoryAnalysis/CalculateScore.port';

/**
 * Interface representing the properties exposed by the Audio Capture Context.
 * Provides application state and control actions to the user interface.
 */
export interface AudioCaptureContextProps {
  /** The current state of the audio capture flow, conforming to {@link AudioCaptureState} */
  state: AudioCaptureState;
  /** Progress information during model load, conforming to {@link ProgressDTO} or null */
  progress: ProgressDTO | null;
  /** Active error details, conforming to {@link ErrorDTO} or null */
  error: ErrorDTO | null;
  /** The generated audio blob after recording completes */
  audioBlob: Blob | null;
  /** True if speech-to-text transcription and scoring is running */
  isAnalyzing: boolean;
  /** The final fluency score and metrics result, conforming to {@link ScoreResult} or null */
  scoreResult: ScoreResult | null;
  /** Triggers downloading and initializing the speech model */
  initializeModel: () => Promise<void>;
  /** Starts the audio capture from the microphone */
  startRecording: () => Promise<void>;
  /** Stops the audio capture and triggers transcription/scoring */
  stopRecording: () => Promise<void>;
  /** Discards the current recording and returns to ready state */
  cancelRecording: () => void;
  /** Resets the entire flow back to idle state and terminates active worker */
  reset: () => void;
  /** Terminates the active model worker and resets flow */
  terminateWorker: () => void;
}

const AudioCaptureContext = createContext<AudioCaptureContextProps | null>(null);

/**
 * Provider component for managing audio capture and speech scoring state.
 * Consumes ports from {@link useDI} and orchestrates them via the {@link useAudioCapture} hook.
 * Automatically initializes the speech model on mount.
 */
export function AudioCaptureProvider({ children }: { children: React.ReactNode }) {
  const { bootstrap, recorder, decoder, analyzer, calculateScoreUseCase } = useDI();

  const capture = useAudioCapture(
    bootstrap,
    recorder,
    decoder,
    analyzer,
    calculateScoreUseCase
  );

  const { initializeModel } = capture;

  // Auto-start model loading on mount or when bootstrap changes
  useEffect(() => {
    initializeModel();
  }, [initializeModel]);

  const value = useMemo(() => capture, [capture]);

  return (
    <AudioCaptureContext.Provider value={value}>
      {children}
    </AudioCaptureContext.Provider>
  );
}

/**
 * Hook to consume the Audio Capture Context.
 * Ensures the UI components are resolved within a valid AudioCaptureProvider.
 *
 * @returns The active capture state and operations conforming to {@link AudioCaptureContextProps}.
 */
export function useAudioCaptureContext(): AudioCaptureContextProps {
  const context = useContext(AudioCaptureContext);
  if (!context) {
    throw new Error('useAudioCaptureContext must be used within an AudioCaptureProvider');
  }
  return context;
}
