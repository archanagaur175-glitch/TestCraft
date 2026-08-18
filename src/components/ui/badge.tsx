import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "indigo" | "cyan" | "emerald" | "amber" | "rose" | "slate";

const variantClasses: Record<Variant, string> = {
  indigo: "bg-accent/15 text-accent border-accent/25",
  cyan: "bg-accent-2/15 text-cyan-600 dark:text-cyan-300 border-accent-2/25",
  emerald: "bg-success/15 text-success border-success/30",
  amber: "bg-warning/15 text-warning border-warning/30",
  rose: "bg-danger/15 text-danger border-danger/30",
  slate: "bg-foreground/5 text-muted border-foreground/10",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: Variant;
}

export function Badge({ children, className, variant = "indigo", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}