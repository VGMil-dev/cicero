import React from 'react';
import { useAudioCaptureContext } from '../../contexts/AudioCaptureContext';
import { ScoreSummaryCard } from '../molecules/ScoreSummaryCard';
import { MetricCard } from '../molecules/MetricCard';
import { RecommendationsCard } from '../molecules/RecommendationsCard';
import { FillerWordBreakdown } from '../molecules/FillerWordBreakdown';
import { VerbatimTranscription } from '../molecules/VerbatimTranscription';

/**
 * Organism component rendering the detailed speech analysis report dashboard.
 * Lays out score summary card, metrics (Velocity, Duration, Score), recommendations,
 * filler word occurrences breakdown, and verbatim transcription using modular molecules.
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
        <ScoreSummaryCard overallScore={scoreResult.metrics.overallScore} />

        <div className="md:col-span-2 flex flex-col gap-6">
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

          <RecommendationsCard
            overallScore={scoreResult.metrics.overallScore}
            fillerWordsBreakdown={scoreResult.metrics.fillerWordsBreakdown}
          />
        </div>
      </div>

      {/* BLOCK 2: LOWER GRID (Filler breakdown & Transcription) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <FillerWordBreakdown
          fillerWordsCount={scoreResult.metrics.fillerWordsCount}
          fillerWordsBreakdown={scoreResult.metrics.fillerWordsBreakdown}
        />

        <VerbatimTranscription chunks={scoreResult.chunks} />
      </div>
    </div>
  );
}
