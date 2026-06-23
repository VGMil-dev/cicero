import { useState, useCallback, useEffect } from 'react';
import { ModelBootstrap } from '../core/SpeechToText/ModelBootstrap.port';
import { AudioRecorder } from '../core/Recorder/AudioRecorder.port';
import { AudioDecoder } from '../core/AudioDecoder/AudioDecoder.port';
import { SpeechAnalyzer } from '../core/SpeechToText/SpeechAnalyzer.port';
import { CalculateScoreUseCase, ScoreResult } from '../core/OratoryAnalysis/CalculateScore.port';
import { AudioCaptureState, ErrorDTO, ErrorCode } from '../core/shared/types';
import { ProgressDTO } from '../core/SpeechToText/types';

/**
 * Hook to orchestrate the AI model bootstrap, audio recording, decoding, analysis, and scoring flows.
 * Handles state transitions for recording and tracks asynchronous analysis progress.
 *
 * @param bootstrap - The adapter to load and bootstrap the AI model, {@link ModelBootstrap}.
 * @param recorder - The adapter to capture hardware microphone input, {@link AudioRecorder}.
 * @param audioDecoder - The adapter to decode audio blobs to mono PCM, {@link AudioDecoder}.
 * @param audioAnalyzer - The adapter to analyze audio PCM and transcribe it, {@link SpeechAnalyzer}.
 * @param calculateScoreUseCase - The use case to evaluate speech and compute scores, {@link CalculateScoreUseCase}.
 */
export function useAudioCapture(
  bootstrap: ModelBootstrap,
  recorder: AudioRecorder,
  audioDecoder: AudioDecoder,
  audioAnalyzer: SpeechAnalyzer,
  calculateScoreUseCase: CalculateScoreUseCase
) {
  const [state, setState] = useState<AudioCaptureState>('idle');
  const [progress, setProgress] = useState<ProgressDTO | null>(null);
  const [error, setError] = useState<ErrorDTO | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  // Monitor worker error/panic events directly
  useEffect(() => {
    if (typeof bootstrap.getWorkerInstance !== 'function') return;

    const worker = bootstrap.getWorkerInstance();
    if (!worker) return;

    const handlePanic = (e: ErrorEvent) => {
      console.error('Fallo crítico del Web Worker detectado en useAudioCapture:', e);
      setState('error');
      setError({
        code: 'WASM_PANIC',
        message: `Fallo crítico de ejecución en el Web Worker: ${e.message || 'Error desconocido'}`,
        details: e,
      });
    };

    worker.addEventListener('error', handlePanic);
    return () => {
      worker.removeEventListener('error', handlePanic);
    };
  }, [bootstrap, state]);

  const initializeModel = useCallback(async () => {
    setState('loading-model');
    setError(null);
    setProgress(null);

    try {
      bootstrap.onProgress((p) => {
        setProgress(p);
        if (p.status === 'panic') {
          setState('error');
          if (p.error) {
            setError(p.error);
          }
        }
      });

      await bootstrap.initialize();
      setState('ready');
    } catch (err: unknown) {
      setState('error');
      const errObj = err as Record<string, unknown> | null;
      const dto = errObj?.dto as Record<string, unknown> | null;
      if (dto && typeof dto.code === 'string' && typeof dto.message === 'string') {
        setError({
          code: dto.code as ErrorCode,
          message: dto.message,
          details: dto.details,
        });
      } else {
        const message = err instanceof Error ? err.message : 'Error al iniciar el modelo de IA';
        setError({
          code: 'MODEL_LOAD_FAILED',
          message,
          details: err,
        });
      }
    }
  }, [bootstrap]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const permissions = await recorder.requestPermissions();
      if (!permissions.microphoneGranted) {
        setState('error');
        setError({
          code: 'PERMISSION_DENIED',
          message: 'El acceso al micrófono fue denegado. Concede los permisos para grabar.',
        });
        return;
      }

      await recorder.startRecording();
      setState('recording');
      setAudioBlob(null);
    } catch (err: unknown) {
      setState('error');
      const errObj = err as Record<string, unknown> | null;
      const dto = errObj?.dto as Record<string, unknown> | null;
      if (dto && typeof dto.code === 'string' && typeof dto.message === 'string') {
        setError({
          code: dto.code as ErrorCode,
          message: dto.message,
          details: dto.details,
        });
      } else {
        const message = err instanceof Error ? err.message : 'No se pudo iniciar la grabación.';
        setError({
          code: 'RECORDING_FAILED',
          message,
          details: err,
        });
      }
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      const blob = await recorder.stopRecording();
      setAudioBlob(blob);
      setState('ready');
      setIsAnalyzing(true);
      setError(null);

      try {
        const pcm = await audioDecoder.decodeTo16kHzMono(blob);
        const transcription = await audioAnalyzer.analyzeAudio(pcm);
        const score = calculateScoreUseCase.execute(transcription);
        setScoreResult(score);
      } catch (procErr: unknown) {
        console.error('Error durante el procesamiento del audio en useAudioCapture:', procErr);
        setState('error');
        const errObj = procErr as Record<string, unknown> | null;
        const dto = errObj?.dto as Record<string, unknown> | null;
        if (dto && typeof dto.code === 'string' && typeof dto.message === 'string') {
          setError({
            code: dto.code as ErrorCode,
            message: dto.message,
            details: dto.details,
          });
        } else {
          const message = procErr instanceof Error ? procErr.message : 'Error al procesar el análisis de audio';
          const code: ErrorCode = message.toLowerCase().includes('decod') || message.toLowerCase().includes('decode')
            ? 'DECODING_FAILED'
            : 'ANALYSIS_FAILED';
          setError({
            code,
            message,
            details: procErr,
          });
        }
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err: unknown) {
      setState('error');
      const errObj = err as Record<string, unknown> | null;
      const dto = errObj?.dto as Record<string, unknown> | null;
      if (dto && typeof dto.code === 'string' && typeof dto.message === 'string') {
        setError({
          code: dto.code as ErrorCode,
          message: dto.message,
          details: dto.details,
        });
      } else {
        const message = err instanceof Error ? err.message : 'Error al detener la grabación.';
        setError({
          code: 'UNKNOWN',
          message,
          details: err,
        });
      }
    }
  }, [recorder, audioDecoder, audioAnalyzer, calculateScoreUseCase]);

  const cancelRecording = useCallback(() => {
    try {
      recorder.cancelRecording();
      setAudioBlob(null);
      setState('ready');
    } catch (err: unknown) {
      setState('error');
      const errObj = err as Record<string, unknown> | null;
      const dto = errObj?.dto as Record<string, unknown> | null;
      if (dto && typeof dto.code === 'string' && typeof dto.message === 'string') {
        setError({
          code: dto.code as ErrorCode,
          message: dto.message,
          details: dto.details,
        });
      } else {
        const message = err instanceof Error ? err.message : 'Error al cancelar la grabación.';
        setError({
          code: 'UNKNOWN',
          message,
          details: err,
        });
      }
    }
  }, [recorder]);

  const reset = useCallback(() => {
    bootstrap.terminate();
    setState('idle');
    setProgress(null);
    setError(null);
    setAudioBlob(null);
    setIsAnalyzing(false);
    setScoreResult(null);
  }, [bootstrap]);

  const terminateWorker = useCallback(() => {
    bootstrap.terminate();
    setState('idle');
    setProgress(null);
    setError(null);
    setAudioBlob(null);
    setIsAnalyzing(false);
    setScoreResult(null);
  }, [bootstrap]);

  return {
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
  };
}

