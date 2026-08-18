import type { Metadata } from "next";
import {
  COMPLIANCE_FAQS,
  PUBLIC_DOMAIN_ITEMS,
  PUBLIC_DOMAIN_NOTE,
  SYNTHETIC_PROVENANCE,
} from "@/lib/data/provenance";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sourcing & Compliance",
};

export default function SourcingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sourcing & Compliance</h1>
        <p className="mt-1 text-sm text-muted">
          How TestCraft keeps every question legal, licensed and auditable.
        </p>
      </header>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold">Two lanes, strict rules</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          TestCraft never ingests copied, scraped or paywalled coaching/publisher question banks. All content
          comes from exactly two sources, and every item is tagged with its lane in the data layer.
        </p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Synthetic lane</h2>
            <Badge variant="cyan">generated-in-house</Badge>
          </div>
          <p className="text-xs text-muted">{SYNTHETIC_PROVENANCE.citation}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="License" v={SYNTHETIC_PROVENANCE.license} />
            <Row k="Permitted use" v={SYNTHETIC_PROVENANCE.permittedUse} />
            <Row k="Reviewed" v={SYNTHETIC_PROVENANCE.reviewedAt} />
          </dl>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Public-domain lane</h2>
            <Badge variant="slate">verified-public</Badge>
          </div>
          <p className="text-xs text-muted">{PUBLIC_DOMAIN_NOTE}</p>
          <dl className="mt-4 space-y-2 text-sm">
            {PUBLIC_DOMAIN_ITEMS.map((p, i) => (
              <div key={i} className="rounded-xl border border-card-border p-3">
                <Row k="Source" v={p.source} />
                <Row k="Citation" v={p.citation} />
                <Row k="License" v={p.license} />
                <Row k="Permitted use" v={p.permittedUse} />
              </div>
            ))}
          </dl>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Per-item audit trail</h2>
        <p className="text-sm leading-relaxed text-muted">
          Every question in the system carries a <code className="rounded bg-foreground/10 px-1 font-mono text-xs">sourceType</code> field and,
          where relevant, a full provenance record. You can always see which lane an item came from —
          directly in the review screen and in the exported answer keys.
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">FAQ</h2>
        <div className="space-y-4">
          {COMPLIANCE_FAQS.map((f) => (
            <div key={f.q} className="rounded-xl border border-card-border p-4">
              <p className="font-medium">{f.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="w-28 shrink-0 font-semibold text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}