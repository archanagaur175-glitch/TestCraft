"use client";

import { cn } from "@/lib/utils";

export interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function Chip({ label, active, onClick, className, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
        active
          ? "border-accent/60 bg-accent/15 text-accent shadow-sm shadow-accent/20"
          : "border-card-border bg-card/40 text-muted hover:border-accent/40 hover:text-foreground",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}