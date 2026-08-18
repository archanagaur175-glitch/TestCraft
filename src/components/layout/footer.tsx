import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl px-4 pb-8">
      <div className="glass flex flex-col items-center justify-between gap-3 rounded-2xl px-6 py-5 sm:flex-row">
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">TestCraft</span> — custom test generator for
          CBSE · ICSE · JEE · NEET · SAT · University
        </p>
        <div className="flex items-center gap-4 text-sm text-muted">
          <Link href="/sourcing" className="transition-colors hover:text-foreground">
            Sourcing & Compliance
          </Link>
          <span className="text-foreground/20">|</span>
          <span>Synthetic-first, provenance-tracked bank</span>
        </div>
      </div>
    </footer>
  );
}