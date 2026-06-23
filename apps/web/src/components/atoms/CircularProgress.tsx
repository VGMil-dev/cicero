import React from 'react';

/**
 * Properties for the CircularProgress component, {@link CircularProgress}.
 */
export interface CircularProgressProps {
  /** The overall score percentage (0 to 100) */
  score: number;
  /** Width and height of the SVG element in pixels (defaults to 144 / 36rem) */
  size?: number;
  /** Thickness of the circular progress line in pixels (defaults to 14) */
  strokeWidth?: number;
}

/**
 * Atom component rendering a circular donut progress indicator with flat shadow drop filter.
 * 
 * @example
 * ```tsx
 * <CircularProgress score={85} />
 * ```
 */
export function CircularProgress({
  score,
  size = 144,
  strokeWidth = 14,
}: CircularProgressProps) {
  const radius = 58;
  const circumference = 364.4; // 2 * Math.PI * 58
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-stone-100"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Foreground circle with neon border */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-neon-green"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(1px 1px 0px rgba(0,0,0,1))' }}
        />
      </svg>
      {/* Central percentage text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-headline font-extrabold text-4xl text-black">
          {score}%
        </span>
      </div>
    </div>
  );
}
