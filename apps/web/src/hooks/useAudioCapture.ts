import { useState, useCallback, useEffect } from 'react';
import { IAudioModelBootstrap } from '../core/ports/audio/IAudioModelBootstrap';
import { IAudioRecorder } from '../core/ports/audio/IAudioRecorder';
import { AudioCaptureState, ErrorDTO, ProgressDTO, ErrorCode } from '../core/ports/audio/types';

/**
 * Hook to orchestrate the AI model bootstrap and audio recording flows.
 * Handles state transitions: idle -> loading-model -> ready -> recording -> ready.
 * Manages errors like permission denied or model loading failures.
 */
export function useAudioCapture(
  bootstrap: IAudioModelBootstrap,
  recorder: IAudioRecorder
) {
  const [state, setState] = useState<AudioCaptureState>('idle');
  const [progress, setProgress] = useState<ProgressDTO | null>(null);
  const [error, setError] = useState<ErrorDTO | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

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
  }, [recorder]);

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
  }, [bootstrap]);

  const terminateWorker = useCallback(() => {
    bootstrap.terminate();
    setState('idle');
    setProgress(null);
    setError(null);
    setAudioBlob(null);
  }, [bootstrap]);

  return {
    state,
    progress,
    error,
    audioBlob,
    initializeModel,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    terminateWorker,
  };
}

