import React from 'react';

/**
 * Properties for the ProgressBar component, {@link ProgressBar}.
 */
export interface ProgressBarProps {
  /** Percentage value of progress (0 to 100) */
  progress: number;
  /** Whether to render the percentage text centered on the bar */
  showText?: boolean;
  /** Extra CSS classes to apply to the container */
  className?: string;
  /** Height class for the progress container (defaults to 'h-8') */
  heightClass?: string;
}

/**
 * Atom component rendering a chunky Neo-Brutalist progress bar with stripes animation.
 * 
 * @example
 * ```tsx
 * <ProgressBar progress={70} showText heightClass="h-6" />
 * ```
 */
export function ProgressBar({
  progress,
  showText = false,
  className = '',
  heightClass = 'h-8',
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${heightClass} bg-white border-3 border-black rounded-xl overflow-hidden relative shadow-[4px_4px_0px_rgba(0,0,0,1)] ${className}`}>
      <div
        className="h-full bg-neon-green border-r-3 border-black transition-all duration-300 animate-stripes"
        style={{ width: `${clampedProgress}%` }}
      />
      {showText && (
        <span className="absolute inset-0 flex items-center justify-center font-headline font-extrabold text-sm text-black">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}
