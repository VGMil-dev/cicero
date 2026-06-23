import React from 'react';
import { Badge } from '../atoms/Badge';

/**
 * Organism component rendering the main header of the Cicero application.
 * Includes the brand title, interactive badge, and metadata description.
 * 
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header() {
  return (
    <header className="max-w-3xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-6">
      <div>
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl uppercase tracking-tight text-black flex items-center gap-3">
          <svg className="w-8 h-8 text-black inline-block flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          Cicero <Badge variant="neon" className="normal-case">MVP</Badge>
        </h1>
        <p className="text-stone-600 mt-2 text-lg font-medium">
          Carga de Modelo de Voz local en segundo plano y captura privada de audio.
        </p>
      </div>
      <div className="flex gap-2">
        <Badge variant="amber">
          Estética Doodle Neo-Brutalista
        </Badge>
      </div>
    </header>
  );
}
