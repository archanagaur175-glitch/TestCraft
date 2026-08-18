"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  Gauge,
  Layers,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  DEFAULT_DIFFICULTY_MIX,
  useConfigStore,
} from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { preparePaper } from "@/lib/generation/prepare";
import type { Difficulty, QuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: "MCQ", label: "MCQ" },
  { value: "AssertionReason", label: "Assertion-Reason" },
  { value: "Numerical", label: "Numerical" },
  { value: "Short", label: "Short Answer" },
  { value: "Long", label: "Long Answer" },
];

const LANES = [
  { value: "mixed", label: "Mixed", hint: "Synthetic + verified public-domain" },
  { value: "synthetic", label: "Synthetic only", hint: "100% machine-generated" },
  { value: "public-domain", label: "Public-domain only", hint: "Limited bank" },
] as const;

export function ConfigureScreen() {
  const router = useRouter();
  const draft = useConfigStore((s) => s.draft);
  const options = useConfigStore((s) => s.options);
  const setOptions = useConfigStore((s) => s.setOptions);
  const reset = useConfigStore((s) => s.reset);
  const toggleSubtopic = useConfigStore((s) => s.toggleSubtopic);
  const createSession = useSessionStore((s) => s.createSession);

  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeEmpty = draft.subtopicIds.length === 0;

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const id of draft.subtopicIds) {
      const code = draft.curriculum ?? "CBSE";
      const subjectId = findSubjectForSubtopic(code, id);
      const key = subjectId ?? id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(id);
    }
    return Array.from(map.entries());
  }, [draft]);

  const derivedTitle = useMemo(() => {
    if (title.trim()) return title.trim();
    const names = draft.subtopicIds.slice(0, 2).map(niceName);
    const base = names.length ? names.join(" + ") : "My practice paper";
    return `${base} · ${draft.curriculum ?? "Mixed"}`;
  }, [title, draft]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const paper = await preparePaper(draft, options, derivedTitle);
      const sessionId = createSession(
        paper.config,
        paper.questions,
        paper.config.timed ? paper.config.totalMinutes * 60_000 : 3600_000,
      );
      router.push(`/exam/${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assemble the paper.");
      setBusy(false);
    }
  };

  const sampleScope = () => {
    reset();
    const tree = CURRICULUM_TREE["CBSE"];
    const ids = tree.slice(0, 8).map((n) => n.id);
    useConfigStore.getState().setCurriculum("CBSE");
    for (const id of ids) toggleSubtopic(id);
  };

  const setMix = (d: Difficulty, value: number) => {
    const next = { ...options.difficultyMix, [d]: value } as Record<Difficulty, number>;
    setOptions({ difficultyMix: next });
  };

  if (scopeEmpty) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Configure your test</h1>
          <p className="mt-1 text-muted">First, choose what you want to be tested on.</p>
        </header>
        <GlassCard className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Layers className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">No sub-topics selected yet</h2>
          <p className="mt-1 text-sm text-muted">
            Browse a curriculum and pick chapters or individual sub-topics — or load a sample
            scope to try the flow instantly.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/curriculum">
              <Button>
                Browse curriculum <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="secondary" onClick={sampleScope}>
              <Sparkles className="h-4 w-4" /> Load sample scope
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configure your test</h1>
          <p className="mt-1 text-sm text-muted">
            {draft.subtopicIds.length} sub-topics in scope · adjust depth, difficulty and format below.
          </p>
        </div>
        <Link href={`/curriculum${draft.curriculum ? `?code=${draft.curriculum}` : ""}`}>
          <Button variant="secondary" size="sm">
            <BookOpenCheck className="h-4 w-4" /> Change scope
          </Button>
        </Link>
      </header>

      {/* Title */}
      <GlassCard className="p-5">
        <label className="text-sm font-medium">Test title</label>
        <input
          value={derivedTitle}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. CBSE Grade 10 – Quadratic Surds"
          className="mt-2 w-full rounded-xl border border-card-border bg-card/50 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent/50"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {grouped.map(([subjectId, ids]) => (
            <Badge key={subjectId} variant="indigo">
              {niceName(subjectId)} · {ids.length}
            </Badge>
          ))}
          <Badge variant="cyan">{draft.subtopicIds.length} sub-topics</Badge>
        </div>
      </GlassCard>

      {/* Format */}
      <GlassCard className="p-5">
        <SectionHeader icon={<Wand2 className="h-4 w-4" />} title="Format" subtitle="Question types and paper size" />
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Question types</p>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                active={options.questionTypes.includes(t.value)}
                onClick={() =>
                  setOptions({
                    questionTypes: options.questionTypes.includes(t.value)
                      ? options.questionTypes.filter((x) => x !== t.value)
                      : [...options.questionTypes, t.value],
                  })
                }
              />
            ))}
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Question count</p>
            <Badge variant="slate">{options.questionCount}</Badge>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            value={options.questionCount}
            onChange={(e) => setOptions({ questionCount: Number(e.target.value) })}
            className="tc-range w-full"
          />
        </div>
      </GlassCard>

      {/* Difficulty */}
      <GlassCard className="p-5">
        <SectionHeader icon={<Gauge className="h-4 w-4" />} title="Difficulty mix" subtitle="How hard should the paper lean?" />
        <div className="mt-4 space-y-3">
          {(Object.keys(DEFAULT_DIFFICULTY_MIX) as unknown as Difficulty[]).map((d) => (
            <div key={d} className="flex items-center gap-3">
              <span className="w-16 text-xs font-semibold text-muted">Level {d}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={options.difficultyMix[d]}
                onChange={(e) => setMix(d, Number(e.target.value))}
                className="tc-range flex-1"
              />
              <span className="w-9 text-right text-xs tabular-nums text-muted">
                {options.difficultyMix[d]}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => setOptions({ difficultyMix: { ...DEFAULT_DIFFICULTY_MIX } })}>
            Reset to balanced
          </Button>
        </div>
      </GlassCard>

      {/* Timing + mode */}
      <GlassCard className="p-5">
        <SectionHeader icon={<Clock className="h-4 w-4" />} title="Timing & mode" />
        <div className="mt-4 flex flex-wrap gap-6">
          {/* timed */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Timed exam</p>
            <SwitchToggle
              value={options.timed}
              onChange={(v) => setOptions({ timed: v })}
              label={options.timed ? "On" : "Off"}
            />
            {options.timed && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>Duration</span>
                  <span className="tabular-nums">{options.totalMinutes} min</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={180}
                  step={5}
                  value={options.totalMinutes}
                  onChange={(e) => setOptions({ totalMinutes: Number(e.target.value) })}
                  className="tc-range w-56"
                />
              </div>
            )}
          </div>

          {/* mock */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Mock exam mode</p>
            <SwitchToggle
              value={options.mockExam}
              onChange={(v) => setOptions({ mockExam: v })}
              label={options.mockExam ? "On" : "Off"}
            />
            <p className="mt-2 max-w-[220px] text-xs text-muted">
              Mirrors the real board layout (section ordering, no mid-test hints).
            </p>
          </div>

          {/* adaptive */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Adaptive routing</p>
            <SwitchToggle
              value={options.adaptive}
              onChange={(v) => setOptions({ adaptive: v })}
              label={options.adaptive ? "On" : "Off"}
            />
            <p className="mt-2 max-w-[240px] text-xs text-muted">
              Weak topics get foundational items first; correct streaks unlock harder ones.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Source lane */}
      <GlassCard className="p-5">
        <SectionHeader
          icon={<Sparkles className="h-4 w-4" />}
          title="Question source"
          subtitle="Only compliant content is used — full sourcing info lives on the Sourcing page."
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {LANES.map((lane) => (
            <button
              key={lane.value}
              onClick={() => setOptions({ sourceLane: lane.value })}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                options.sourceLane === lane.value
                  ? "border-accent/50 bg-accent/10"
                  : "border-card-border hover:border-accent/30",
              )}
            >
              <p className="text-sm font-semibold">{lane.label}</p>
              <p className="mt-1 text-xs text-muted">{lane.hint}</p>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Start */}
      <GlassCard className="p-5">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">
              {options.questionCount} questions · {options.questionTypes.length} formats
              {options.timed ? ` · ${options.totalMinutes} minutes` : " · untimed"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {draft.subtopicIds.length} sub-topics · source: {options.sourceLane}
            </p>
          </div>
          <Button size="lg" disabled={busy} onClick={start} className="sm:px-8">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Assembling paper…
              </>
            ) : (
              <>
                Start test <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </GlassCard>
    </div>
  );
}

// --- helpers ---------------------------------------------------------------

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 text-accent">
        {icon}
      </span>
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

function SwitchToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2"
      aria-pressed={value}
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          value ? "bg-accent" : "bg-foreground/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            value ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </button>
  );
}

// Scans the bundled curriculum data (avoid circular import at module scope).
import { CURRICULA } from "@/lib/data/curricula";

const CURRICULUM_TREE: Record<string, Array<{ id: string }>> = (() => {
  const acc: Record<string, Array<{ id: string }>> = {};
  for (const c of CURRICULA) {
    acc[c.code] = c.subjects[0].chapters[0].subtopics.map((st) => ({ id: st.id }));
  }
  return acc;
})();

function findSubjectForSubtopic(code: string, subtopicId: string): string | undefined {
  for (const s of CURRICULA.find((c) => c.code === code)?.subjects ?? []) {
    for (const chx of s.chapters) {
      if (chx.subtopics.some((st) => st.id === subtopicId)) return s.id;
    }
  }
  return undefined;
}

function niceName(raw: string): string {
  const c = CURRICULA.find((c) => c.code === "CBSE");
  if (!c) return raw;
  for (const s of c.subjects) {
    if (s.id === raw) return s.name;
    for (const chx of s.chapters) {
      const st = chx.subtopics.find((x) => x.id === raw);
      if (st) return st.name;
    }
  }
  return raw;
}