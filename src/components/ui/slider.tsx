"use client";

import { cn } from "@/lib/utils";

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  label?: string;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted">{label}</span>
          <span className="font-semibold text-accent">{format ? format(value) : value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-full bg-transparent",
          "h-2 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-thumb]:mt-[-3px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent",
          "[&::-webkit-slider-thumb]:shadow-md",
        )}
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, color-mix(in srgb, var(--foreground) 15%, transparent) ${pct}%)`,
        }}
      />
    </div>
  );
}