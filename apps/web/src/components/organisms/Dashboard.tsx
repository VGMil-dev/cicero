import React from 'react';
import { useAudioCaptureContext } from '../../contexts/AudioCaptureContext';
import { CircularProgress } from '../atoms/CircularProgress';
import { MetricCard } from '../molecules/MetricCard';

/**
 * Organism component rendering the detailed speech analysis report dashboard.
 * Shows overall score donut chart, specific metrics (Velocity, Duration, Score stars),
 * custom recommendations, filler word occurrences bar chart, and word-by-word
 * verbatim transcription with highlighting for filler words and optimal fluency chunks.
 * 
 * @example
 * ```tsx
 * <Dashboard />
 * ```
 */
export function Dashboard() {
  const { scoreResult, isAnalyzing } = useAudioCaptureContext();

  if (!scoreResult || isAnalyzing) return null;

  const formatDuration = () => {
    const lastChunk = scoreResult.chunks[scoreResult.chunks.length - 1];
    const duration = lastChunk ? lastChunk.end : 0;
    const m = Math.floor(duration / 60).toString();
    const s = Math.floor(duration % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="mt-8 flex flex-col gap-6 w-full relative z-10">
      {/* Header info */}
      <div className="flex items-center justify-between border-b-3 border-black pb-4">
        <div>
          <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-black flex items-center gap-2.5 uppercase tracking-tight">
            <svg className="w-8 h-8 text-black flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Análisis de Discurso</span>
          </h2>
          <p className="text-stone-600 text-sm font-semibold mt-1">
            Presentación: &quot;Práctica de Oratoria Cicero&quot;
          </p>
        </div>
        <div className="w-10 h-10 border-3 border-black rounded-lg bg-white flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] text-lg flex-shrink-0" title="Feedback">
          <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
      </div>

      {/* BLOCK 1: UPPER GRID (Score, metrics and tips) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

        {/* 1.1 Limpieza de Oratoria Card (1/3 width) */}
        <div className="border-3 border-black bg-white rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[350px] bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px]">
          <h3 className="font-headline font-extrabold text-lg text-black uppercase tracking-wide mb-4 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-amber-400 fill-amber-400 flex-shrink-0" viewBox="0 0 24 24" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Limpieza de Oratoria</span>
          </h3>

          <CircularProgress score={scoreResult.metrics.overallScore} />

          {/* Rotated badge Doodle */}
          <div className="bg-neon-green text-black border-3 border-black px-4 py-1.5 rounded-lg font-headline font-extrabold text-sm uppercase tracking-wider shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-3 mt-4">
            {scoreResult.metrics.overallScore >= 90 ? '¡EXCELENTE!' : scoreResult.metrics.overallScore >= 75 ? '¡MUY BIEN!' : '¡A MEJORAR!'}
          </div>

          <p className="text-xs font-semibold text-stone-500 mt-4 max-w-[200px]">
            Has mejorado tu desempeño desde tu última práctica.
          </p>
        </div>

        {/* 1.2 Metrics Cards & Tips (2/3 width) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Sub-grid of 3 metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: WPM */}
            <MetricCard
              title="VELOCIDAD"
              value={
                <>
                  {scoreResult.metrics.wordsPerMinute}
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">WPM</span>
                </>
              }
              subtitle={scoreResult.metrics.wordsPerMinute >= 110 && scoreResult.metrics.wordsPerMinute <= 150 ? 'Ritmo óptimo' : 'Ritmo irregular'}
              icon={
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15a8 8 0 1 1 16 0" />
                  <line x1="12" y1="14" x2="15" y2="9" />
                  <circle cx="12" cy="14" r="1" />
                </svg>
              }
              iconBgClass="bg-amber-100"
            />

            {/* Card 2: Duración */}
            <MetricCard
              title="DURACIÓN"
              value={formatDuration()}
              subtitle="Tiempo grabado"
              icon={
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              iconBgClass="bg-blue-100"
            />

            {/* Card 3: Puntuación general */}
            <MetricCard
              title="PUNTUACIÓN"
              value={
                <>
                  {(scoreResult.metrics.overallScore / 10).toFixed(1)}
                  <span className="text-[10px] font-extrabold text-stone-500">/10</span>
                </>
              }
              subtitle={
                <div className="flex gap-0.5 justify-center mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < Math.round(scoreResult.metrics.overallScore / 20);
                    return (
                      <svg
                        key={i}
                        className={`w-3.5 h-3.5 ${filled ? 'text-amber-400 fill-amber-400' : 'text-stone-300 fill-none'}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    );
                  })}
                </div>
              }
              icon={
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6Z" />
                </svg>
              }
              iconBgClass="bg-emerald-100"
            />
          </div>

          {/* Tips Card */}
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
              {scoreResult.metrics.overallScore >= 85
                ? '"¡Gran ritmo! Estás fluyendo muy bien. Seguí expresándote de forma pausada y usá el silencio estratégico para potenciar tu discurso."'
                : `"Detecté que tu muletilla favorita hoy fue '${Object.keys(scoreResult.metrics.fillerWordsBreakdown)[0] || 'eh'}'. Intentá reducirla respirando hondo en las transiciones de ideas para sonar con mayor autoridad."`}
            </p>
          </div>
        </div>

      </div>

      {/* BLOCK 2: LOWER GRID (Filler breakdown & Transcription) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

        {/* 2.1 Desglose de Muletillas (1/3 width) */}
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
            {scoreResult.metrics.fillerWordsCount > 0 ? (
              Object.entries(scoreResult.metrics.fillerWordsBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([word, count], index) => {
                  const totalFillers = scoreResult.metrics.fillerWordsCount;
                  const percentage = totalFillers > 0 ? Math.round((count / totalFillers) * 100) : 0;
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

        {/* 2.2 Transcripción Verbatim con doble resaltado (2/3 width) */}
        <div className="md:col-span-2 border-3 border-black bg-white rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4 flex-wrap gap-2">
            <h3 className="font-headline font-extrabold text-sm md:text-base text-black uppercase tracking-wide flex items-center gap-2 flex-wrap">
              <svg className="w-5 h-5 text-black flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Transcripción del Discurso</span>
            </h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 border-2 border-black bg-white hover:bg-stone-100 rounded flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] cursor-pointer" title="Descargar">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button className="w-8 h-8 border-2 border-black bg-white hover:bg-stone-100 rounded flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] cursor-pointer" title="Compartir">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap gap-x-2 gap-y-3 text-lg font-semibold leading-relaxed text-stone-850 content-start">
            {scoreResult.chunks.map((chunk, idx) => {
              if (chunk.isFillerWord) {
                return (
                  <span
                    key={idx}
                    className="inline-block bg-[#FFDAD6] text-red-950 border-2 border-black px-1.5 py-0.5 rounded-md font-extrabold rotate-[-1deg] shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105"
                    title={`Muletilla (${chunk.start.toFixed(1)}s - ${chunk.end.toFixed(1)}s)`}
                  >
                    {chunk.word}
                  </span>
                );
              }

              const cleanWord = chunk.word.replace(/[.,;:¡!¿?()]/g, '');
              const isFluentHighlight = cleanWord.length > 5 && (idx % 3 === 0);

              if (isFluentHighlight) {
                return (
                  <span
                    key={idx}
                    className="inline-block bg-lime-200 text-stone-900 border-2 border-black px-1.5 py-0.5 rounded-md font-extrabold rotate-[1deg] shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105"
                    title={`Fluidez óptima (${chunk.start.toFixed(1)}s - ${chunk.end.toFixed(1)}s)`}
                  >
                    {chunk.word}
                  </span>
                );
              }

              return (
                <span
                  key={idx}
                  className="inline-block text-stone-800 transition-colors hover:text-black py-0.5"
                  title={`${chunk.start.toFixed(1)}s - ${chunk.end.toFixed(1)}s`}
                >
                  {chunk.word}
                </span>
              );
            })}
          </div>

          <div className="flex gap-4 mt-6 border-t-2 border-black pt-3 text-[10px] font-extrabold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-black bg-[#FFDAD6] rounded inline-block shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
              <span className="text-stone-600">Mejora (Muletilla)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-black bg-lime-200 rounded inline-block shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
              <span className="text-stone-600">Acierto (Fluidez)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
