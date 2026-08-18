"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Compass,
  FlaskConical,
  Layers,
  LayoutDashboard,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/curriculum", label: "Curriculum", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/sourcing", label: "Sourcing", icon: FlaskConical },
];

export function Navbar() {
  const pathname = usePathname();
  const isExam = pathname.startsWith("/exam");

  if (isExam) return null;

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl px-3">
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-md shadow-accent/30">
            <Compass className="h-4.5 w-4.5" />
          </span>
          <span className="text-base font-bold tracking-tight">
            Test<span className="gradient-text">Craft</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/curriculum"
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-accent/25 transition-all hover:brightness-110 sm:inline-flex"
          >
            <ScrollText className="h-4 w-4" />
            New Test
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}