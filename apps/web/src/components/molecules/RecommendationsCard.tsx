import React from 'react';

/**
 * Properties for the RecommendationsCard component, {@link RecommendationsCard}.
 */
export interface RecommendationsCardProps {
  /** The overall score percentage (0 to 100) */
  overallScore: number;
  /** Dictionary of filler words and their occurrences count */
  fillerWordsBreakdown: Record<string, number>;
}

/**
 * Molecule component rendering the custom recommendations panel based on speech fluency.
 * 
 * @example
 * ```tsx
 * <RecommendationsCard overallScore={85} fillerWordsBreakdown={{ 'eh': 3 }} />
 * ```
 */
export function RecommendationsCard({
  overallScore,
  fillerWordsBreakdown,
}: RecommendationsCardProps) {
  const favoriteFiller = Object.keys(fillerWordsBreakdown)[0] || 'eh';

  return (
    <div className="border-3 border-black bg-[#E1E1F5] rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col gap-2 relative overflow-hidden">
      {/* Sketchy circles in background */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full border-3 border-black opacity-10" />
      <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full border-3 border-black opacity-10" />

      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-black flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <h4 className="font-headline font-extrabold text-sm uppercase text-black tracking-wider">
          Recomendaciones de Oratoria
        </h4>
      </div>

      <p className="text-sm text-stone-850 leading-relaxed font-semibold italic">
        {overallScore >= 85
          ? '"¡Gran ritmo! Estás fluyendo muy bien. Seguí expresándote de forma pausada y usá el silencio estratégico para potenciar tu discurso."'
          : `"Detecté que tu muletilla favorita hoy fue '${favoriteFiller}'. Intentá reducirla respirando hondo en las transiciones de ideas para sonar con mayor autoridad."`}
      </p>
    </div>
  );
}
