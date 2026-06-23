import React from 'react';

/**
 * Available visual variants for the Neo-Brutalist Button component.
 * 
 * - `primary`: High-emphasis action (neon-green fill, strong shadow).
 * - `dark`: High-emphasis dark action (stone-900 fill, white text).
 * - `danger`: Destructive or stop actions (red fill).
 * - `ghost`: Low-emphasis secondary actions (light stone fill).
 * - `icon`: Square icon-only button (white fill, compact padding).
 */
export type ButtonVariant = 'primary' | 'dark' | 'danger' | 'ghost' | 'icon';

/**
 * Available shape options for the Button component.
 * 
 * - `rectangle`: Standard pill-like rounded rectangle.
 * - `circle`: Large circular button (used for microphone CTA).
 */
export type ButtonShape = 'rectangle' | 'circle';

/**
 * Properties for the Neo-Brutalist Button atom, {@link Button}.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button shape */
  shape?: ButtonShape;
  /** Extra CSS classes to append */
  className?: string;
  /** Button content */
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-neon-green text-black font-extrabold border-3 border-black ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  dark:
    'bg-stone-900 text-white font-extrabold border-3 border-black ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  danger:
    'bg-red-500 text-white font-extrabold border-3 border-black ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  ghost:
    'bg-stone-100 text-stone-800 font-bold border-3 border-black ' +
    'shadow-[4px_4px_0px_rgba(0,0,0,1)] ' +
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  icon:
    'bg-white text-black border-2 border-black ' +
    'shadow-[2px_2px_0px_rgba(0,0,0,1)] ' +
    'hover:bg-stone-100 ' +
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]',
};

const shapeStyles: Record<ButtonShape, string> = {
  rectangle: 'rounded-xl px-5 py-3 flex items-center justify-center gap-1.5',
  circle: 'rounded-full w-24 h-24 flex items-center justify-center group',
};

/**
 * Atom component for Neo-Brutalist interactive buttons.
 * Provides consistent shadow, hover lift, and active press effects across all variants.
 *
 * @example
 * ```tsx
 * // Primary action
 * <Button variant="primary" onClick={initializeModel}>
 *   Inicializar Modelo
 * </Button>
 *
 * // Destructive action
 * <Button variant="danger" onClick={stopRecording}>
 *   Terminar Grabación
 * </Button>
 *
 * // Icon button
 * <Button variant="icon" title="Descargar">
 *   <DownloadIcon />
 * </Button>
 *
 * // Circular CTA (microphone button)
 * <Button variant="primary" shape="circle" onClick={startRecording}>
 *   <MicIcon />
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  shape = 'rectangle',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        transition-all cursor-pointer
        ${variantStyles[variant]}
        ${shapeStyles[shape]}
        ${shape === 'icon' ? 'w-8 h-8 rounded' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </button>
  );
}
