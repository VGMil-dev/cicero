import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage a simple counting timer in seconds.
 * 
 * @param isActive - Determines whether the timer should run.
 * @example
 * ```typescript
 * const { seconds, formatTime, resetTimer } = useTimer(state === 'recording');
 * ```
 */
export function useTimer(isActive: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setSeconds((t) => t + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  const resetTimer = useCallback(() => {
    setSeconds(0);
  }, []);

  const formatTime = useCallback(() => {
    const displayTime = isActive ? seconds : 0;
    const m = Math.floor(displayTime / 60).toString().padStart(2, '0');
    const s = (displayTime % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [isActive, seconds]);

  return {
    seconds,
    resetTimer,
    formatTime,
  };
}
