import React from 'react';

/**
 * Properties for the MetricCard component, {@link MetricCard}.
 */
export interface MetricCardProps {
  /** Uppercase title of the metric */
  title: string;
  /** Large text value of the metric (e.g. "120 WPM") */
  value: React.ReactNode;
  /** Explanatory subtext or rating details */
  subtitle: React.ReactNode;
  /** The SVG icon element to display */
  icon: React.ReactNode;
  /** Background Tailwind color class for the icon container (e.g. "bg-amber-100") */
  iconBgClass: string;
}

/**
 * Molecule component rendering a single Neo-Brutalist metric slot inside the speech report dashboard.
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   title="Velocidad"
 *   value="130 WPM"
 *   subtitle="Ritmo óptimo"
 *   icon={<svg>...</svg>}
 *   iconBgClass="bg-amber-100"
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBgClass,
}: MetricCardProps) {
  return (
    <div className="border-3 border-black bg-white rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-2.5 min-w-0">
      <div className={`w-10 h-10 border-2 border-black rounded-lg ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 w-full">
        <div className="font-headline font-extrabold uppercase text-[10px] text-stone-500 leading-normal truncate w-full">
          {title}
        </div>
        <div className="font-headline font-extrabold text-2xl text-black leading-normal flex items-baseline justify-center gap-1">
          {value}
        </div>
        <div className="text-[10px] font-semibold text-stone-500 leading-normal w-full break-words">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
