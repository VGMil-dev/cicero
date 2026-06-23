import React from 'react';

/**
 * Properties for the FillerWordBreakdown component, {@link FillerWordBreakdown}.
 */
export interface FillerWordBreakdownProps {
  /** Total count of identified filler words */
  fillerWordsCount: number;
  /** Dictionary mapping each filler word to its specific occurrence count */
  fillerWordsBreakdown: Record<string, number>;
}

/**
 * Molecule component rendering the breakdown of filler words.
 * Shows horizontal percentage progress bars and pauses recommendations.
 * 
 * @example
 * ```tsx
 * <FillerWordBreakdown fillerWordsCount={5} fillerWordsBreakdown={{ 'eh': 3, 'bueno': 2 }} />
 * ```
 */
export function FillerWordBreakdown({
  fillerWordsCount,
  fillerWordsBreakdown,
}: FillerWordBreakdownProps) {
  return (
    <div className="border-3 border-black bg-white rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
      <h3 className="font-headline font-extrabold text-sm md:text-base text-black uppercase tracking-wide border-b-2 border-black pb-2 flex items-center gap-2 flex-wrap">
        <svg className="w-5 h-5 text-black flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span>Desglose de Muletillas</span>
      </h3>

      <div className="flex flex-col gap-3 flex-1 justify-start">
        {fillerWordsCount > 0 ? (
          Object.entries(fillerWordsBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([word, count], index) => {
              const percentage = fillerWordsCount > 0 ? Math.round((count / fillerWordsCount) * 100) : 0;
              const barColor = index === 0 ? 'bg-red-500' : 'bg-stone-700';

              return (
                <div key={word} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="bg-[#DFFF00] border border-black px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      &quot;{word}&quot;
                    </span>
                    <span className="text-stone-700">{count} veces</span>
                  </div>
                  <div className="w-full h-3 border-2 border-black rounded-full overflow-hidden bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <div
                      className={`h-full ${barColor} border-r-2 border-black`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
        ) : (
          <p className="text-xs text-stone-500 italic text-center py-4">
            ¡Perfecto! No usaste muletillas.
          </p>
        )}
      </div>

      <div className="border-2 border-dashed border-black rounded-xl p-3 bg-stone-50 text-[10px] leading-relaxed font-semibold">
        <span className="font-headline font-extrabold uppercase text-stone-500 block mb-1">
          Recomendación de pausa:
        </span>
        Si sentís la necesidad de rellenar con un sonido, pausá en silencio durante 1 segundo para ordenar tus ideas.
      </div>
    </div>
  );
}
