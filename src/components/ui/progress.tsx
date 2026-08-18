import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--foreground) 10%, transparent)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-2xl font-bold tracking-tight" style={{ fontSize: size / 5 }}>
            {label}
          </span>
        )}
        {sublabel && <span className="text-[11px] text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}

export function ScoreBar({
  value,
  color = "accent",
  className,
}: {
  value: number;
  color?: "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const colors = {
    accent: "from-accent to-accent-2",
    success: "from-emerald-500 to-teal-400",
    warning: "from-amber-500 to-orange-400",
    danger: "from-rose-500 to-red-400",
  };
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-foreground/10", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", colors[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}