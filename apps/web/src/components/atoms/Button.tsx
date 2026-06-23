import React from 'react';

/**
 * Available visual variants for the Neo-Brutalist Button component.
 * Each variant defines only border style, shadow depth, and hover/active interaction effects.
 * Colors and padding are controlled by `size` and `className`.
 *
 * - `primary`: Strong 4px shadow with lift on hover (for high-emphasis actions).
 * - `dark`: Same mechanics as primary (for dark fills like stone-900).
 * - `danger`: Same mechanics as primary (for red/destructive fills).
 * - `ghost`: Smaller 2px shadow with minimal lift (for secondary/neutral actions).
 * - `icon`: Compact 2px border, no lift (for square icon-only buttons).
 */
export type ButtonVariant = 'primary' | 'dark' | 'danger' | 'ghost' | 'icon';

/**
 * Available shape options for the Button component.
 *
 * - `rectangle`: Rounded rectangle (uses size prop for padding).
 * - `circle`: Large circular button (w-24 h-24, used for the microphone CTA).
 */
export type ButtonShape = 'rectangle' | 'circle';

/**
 * Common padding size presets for rectangle buttons.
 *
 * - `sm`: `px-3 py-1.5` — compact controls (Reset, Mode toggle)
 * - `md`: `px-5 py-3` — standard actions (Retry, IA Reset)
 * - `lg`: `px-6 py-4` — prominent recording controls
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Properties for the Neo-Brutalist Button atom, {@link Button}.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant (controls border, shadow and interaction effects only) */
  variant?: ButtonVariant;
  /** Button shape */
  shape?: ButtonShape;
  /**
   * Padding size preset for rectangle buttons.
   * Ignored when shape is `circle` or variant is `icon`.
   * @default 'md'
   */
  size?: ButtonSize;
  /** Extra CSS classes — use for colors, specific overrides and layout */
  className?: string;
  /** Button content */
  children: React.ReactNode;
}

// Only interaction mechanics — borders, shadows, hover/active transforms.
// Colors are intentionally NOT here so callers control them freely via className.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border-3 border-black font-extrabold ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  dark:
    'border-3 border-black font-extrabold ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  danger:
    'border-3 border-black font-extrabold ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  ghost:
    'border-2 border-black font-bold ' +
    'shadow-[2px_2px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]',
  icon:
    'border-2 border-black ' +
    'shadow-[2px_2px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]',
};

const shapeStyles: Record<ButtonShape, string> = {
  rectangle: 'rounded-xl flex items-center justify-center gap-1.5',
  circle: 'rounded-full w-24 h-24 flex items-center justify-center group',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-5 py-3',
  lg: 'px-6 py-4',
};

/**
 * Atom component for Neo-Brutalist interactive buttons.
 * Provides consistent border, shadow, hover lift and active press effects across all variants.
 *
 * Colors are NOT embedded in variant styles — pass them via `className` to avoid
 * Tailwind class-ordering conflicts and ensure full design flexibility.
 *
 * @example
 * ```tsx
 * // Primary action (color set by caller)
 * <Button variant="primary" size="md" className="bg-neon-green text-black uppercase tracking-wider">
 *   Inicializar Modelo
 * </Button>
 *
 * // Destructive action
 * <Button variant="danger" size="lg" className="bg-red-500 text-white uppercase tracking-wide">
 *   Terminar Grabación
 * </Button>
 *
 * // Secondary / ghost
 * <Button variant="ghost" size="sm" className="bg-stone-100 text-stone-800 uppercase">
 *   Reiniciar
 * </Button>
 *
 * // Icon button (pass w-8 h-8 and colors in className)
 * <Button variant="icon" className="w-8 h-8 rounded bg-white hover:bg-stone-100">
 *   <DownloadIcon />
 * </Button>
 *
 * // Circular CTA (microphone)
 * <Button variant="primary" shape="circle" className="bg-neon-green text-black">
 *   <MicIcon />
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  shape = 'rectangle',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isIcon = variant === 'icon';
  const isCircle = shape === 'circle';

  return (
    <button
      className={[
        'transition-all cursor-pointer',
        variantStyles[variant],
        shapeStyles[shape],
        !isIcon && !isCircle ? sizeStyles[size] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
