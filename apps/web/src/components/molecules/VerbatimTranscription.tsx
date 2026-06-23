import React from 'react';
import { AudioChunkDTO } from '../../core/OratoryAnalysis/types';
import { Button } from '../atoms/Button';

/**
 * Properties for the VerbatimTranscription component, {@link VerbatimTranscription}.
 */
export interface VerbatimTranscriptionProps {
  /** The collection of transcribed words with timestamp and filler classifications */
  chunks: AudioChunkDTO[];
}

/**
 * Molecule component rendering the speech transcription text.
 * Flags filler words in pink and highlights fluent words in green,
 * providing interactive hovers with timestamps.
 * 
 * @example
 * ```tsx
 * <VerbatimTranscription chunks={scoreResult.chunks} />
 * ```
 */
export function VerbatimTranscription({ chunks }: VerbatimTranscriptionProps) {
  return (
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
          <Button variant="icon" className="w-8 h-8 rounded bg-white hover:bg-stone-100" title="Descargar">
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </Button>
          <Button variant="icon" className="w-8 h-8 rounded bg-white hover:bg-stone-100" title="Compartir">
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-wrap gap-x-2 gap-y-3 text-lg font-semibold leading-relaxed text-stone-850 content-start">
        {chunks.map((chunk, idx) => {
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
  );
}
