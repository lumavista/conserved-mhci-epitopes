import { useCallback } from "react";

const thumbStyles =
  "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--color-accent)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-10";
const trackStyles =
  "h-2 w-full appearance-none rounded-full border-0 bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full";

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
  "aria-label"?: [string, string];
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value: [minVal, maxVal],
  onChange,
  className = "",
  "aria-label": ariaLabels,
}: RangeSliderProps) {
  const range = max - min;
  const minPct = ((minVal - min) / range) * 100;
  const maxPct = ((maxVal - min) / range) * 100;
  const collapsed = minVal === maxVal;

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      if (minVal === maxVal) {
        onChange([v, v]);
      } else {
        onChange([Math.min(v, maxVal), maxVal]);
      }
    },
    [minVal, maxVal, onChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange([minVal, Math.max(v, minVal)]);
    },
    [minVal, onChange]
  );

  const handleDoubleClick = useCallback(() => {
    if (collapsed) {
      onChange([minVal, Math.min(minVal + 1, max)]);
    }
  }, [collapsed, minVal, max, onChange]);

  return (
    <div
      className={`range-slider relative h-8 w-full ${className}`}
      data-collapsed={collapsed ? "true" : undefined}
      onDoubleClick={handleDoubleClick}
    >
      <style>{`
        .range-slider[data-collapsed] input:last-of-type::-webkit-slider-thumb { opacity: 0; }
        .range-slider[data-collapsed] input:last-of-type::-moz-range-thumb { opacity: 0; }
        .range-slider[data-collapsed] input:last-of-type { pointer-events: none; }
      `}</style>
      <div
        className="absolute top-1/2 left-0 h-2 w-full -translate-y-1/2 rounded-full bg-[var(--color-border)]"
        aria-hidden
      />
      <div
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--color-accent)]/40"
        style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        aria-hidden
      />
      <input
        type="range"
        min={min}
        max={maxVal}
        step={step}
        value={minVal}
        onChange={handleMinChange}
        className={`absolute top-1/2 left-0 h-2 -translate-y-1/2 ${trackStyles} ${thumbStyles}`}
        style={{ width: `${maxPct}%` }}
        aria-label={ariaLabels?.[0] ?? "Minimum"}
      />
      <input
        type="range"
        min={minVal}
        max={max}
        step={step}
        value={maxVal}
        onChange={handleMaxChange}
        aria-hidden={collapsed}
        className={`absolute top-1/2 h-2 -translate-y-1/2 ${trackStyles} ${thumbStyles}`}
        style={{ left: `${minPct}%`, width: `${100 - minPct}%` }}
        aria-label={ariaLabels?.[1] ?? "Maximum"}
      />
    </div>
  );
}
