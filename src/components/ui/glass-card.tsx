import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
  interactive?: boolean;
}

export function GlassCard({ children, className, glow, interactive, onClick, ...props }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass rounded-2xl transition-all duration-300",
        glow && "ring-glow",
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}