"use client";

import { cn } from "@/lib/utils";

export type PaletteState = "unseen" | "seen" | "answered" | "flagged" | "current";

export interface PaletteItem {
  index: number;
  state: PaletteState;
}

export function Palette({
  items,
  currentSectionLabel,
  onJump,
  answeredCount,
  flaggedCount,
}: {
  items: PaletteItem[];
  currentSectionLabel?: string;
  onJump: (index: number) => void;
  answeredCount: number;
  flaggedCount: number;
}) {
  return (
    <aside className="flex h-fit w-full flex-col gap-4 rounded-2xl border border-card-border bg-card/40 p-4 lg:sticky lg:top-24 lg:w-60">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Navigator</h3>
        <BadgeInline>{answeredCount}/{items.length}</BadgeInline>
      </div>
      {currentSectionLabel && (
        <p className="-mt-2 text-xs text-muted">{currentSectionLabel}</p>
      )}
      <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.index}
            onClick={() => onJump(item.index)}
            aria-label={`Question ${item.index + 1}`}
            className={cn(
              "flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              item.state === "current" && "ring-2 ring-accent ring-offset-1 ring-offset-card",
              item.state === "answered" && "bg-accent/80 text-white",
              item.state === "seen" && "bg-foreground/10 text-foreground",
              item.state === "unseen" && "bg-foreground/5 text-muted",
              item.state === "flagged" && "bg-amber-400 text-amber-950",
            )}
          >
            {item.index + 1}
          </button>
        ))}
      </div>
      <Legend
        items={[
          { swatch: "bg-accent/80", label: "Answered" },
          { swatch: "bg-amber-400", label: "Flagged" },
          { swatch: "bg-foreground/10", label: "Seen" },
          { swatch: "bg-foreground/5", label: "Unseen" },
        ]}
      />
      <div className="mt-1 border-t border-card-border pt-3">
        <p className="text-xs text-muted">
          <span className="font-semibold text-amber-400">{flaggedCount}</span> flagged ·{" "}
          <span className="font-semibold text-accent">{answeredCount}</span> answered
        </p>
      </div>
    </aside>
  );
}

function BadgeInline({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold tabular-nums">
      {children}
    </span>
  );
}

function Legend({ items }: { items: Array<{ swatch: string; label: string }> }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className={cn("h-2.5 w-2.5 rounded-[4px]", it.swatch)} />
          {it.label}
        </span>
      ))}
    </div>
  );
}