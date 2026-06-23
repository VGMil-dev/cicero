import React from 'react';

/**
 * Properties for the Badge component, {@link Badge}.
 */
export interface BadgeProps {
  /** The content to display inside the badge */
  children: React.ReactNode;
  /** Style variants corresponding to Cicero's Neo-Brutalist design themes */
  variant?: 'neon' | 'amber' | 'default';
  /** Extra tailwind CSS classes to apply */
  className?: string;
}

/**
 * Atom component rendering a Neo-Brutalist badge with flat shadow and border.
 * Can be rotated or styled differently based on variant.
 * 
 * @example
 * ```tsx
 * <Badge variant="neon">MVP</Badge>
 * ```
 */
export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyle = "inline-block border-2 border-black font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105";
  
  const variantStyles = {
    default: "bg-white text-black text-xs px-3 py-1",
    neon: "bg-neon-green text-black text-xs px-2 py-1 rotate-2",
    amber: "bg-amber-100 text-stone-800 text-xs px-3 py-1 rounded-full -rotate-1",
  };

  return (
    <span className={`${baseStyle} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
