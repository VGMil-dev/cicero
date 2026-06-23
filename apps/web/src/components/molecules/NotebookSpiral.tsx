import React from 'react';

/**
 * Molecule component rendering the notebook spiral decoration on the left edge.
 * Part of Cicero's Neo-Brutalist doodle aesthetics.
 * 
 * @example
 * ```tsx
 * <NotebookSpiral />
 * ```
 */
export function NotebookSpiral() {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-6 bg-stone-100 border-r-4 border-black select-none">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center -space-x-1">
          <div className="w-4 h-2 bg-stone-300 rounded-full border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.5)]" />
          <div className="w-2 h-2 rounded-full bg-stone-800" />
        </div>
      ))}
    </div>
  );
}
