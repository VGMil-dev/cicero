import React from 'react';
import { CircularProgress } from '../atoms/CircularProgress';

/**
 * Properties for the ScoreSummaryCard component, {@link ScoreSummaryCard}.
 */
export interface ScoreSummaryCardProps {
  /** The overall score percentage (0 to 100) */
  overallScore: number;
}

/**
 * Molecule component rendering the overall score summary card.
 * Displays a CircularProgress donut score, rating title, and rotated brutalist badge.
 * 
 * @example
 * ```tsx
 * <ScoreSummaryCard overallScore={85} />
 * ```
 */
export function ScoreSummaryCard({ overallScore }: ScoreSummaryCardProps) {
  return (
    <div className="border-3 border-black bg-white rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[350px] bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px]">
      <h3 className="font-headline font-extrabold text-lg text-black uppercase tracking-wide mb-4 flex items-center justify-center gap-2">
        <svg className="w-5 h-5 text-amber-400 fill-amber-400 flex-shrink-0" viewBox="0 0 24 24" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>Limpieza de Oratoria</span>
      </h3>

      <CircularProgress score={overallScore} />

      {/* Rotated badge Doodle */}
      <div className="bg-neon-green text-black border-3 border-black px-4 py-1.5 rounded-lg font-headline font-extrabold text-sm uppercase tracking-wider shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-3 mt-4">
        {overallScore >= 90 ? '¡EXCELENTE!' : overallScore >= 75 ? '¡MUY BIEN!' : '¡A MEJORAR!'}
      </div>

      <p className="text-xs font-semibold text-stone-500 mt-4 max-w-[200px]">
        Has mejorado tu desempeño desde tu última práctica.
      </p>
    </div>
  );
}
