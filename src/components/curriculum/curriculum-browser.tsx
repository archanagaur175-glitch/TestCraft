"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Layers, Search, SlidersHorizontal, X } from "lucide-react";
import { CURRICULA, CURRICULUM_MAP } from "@/lib/data/curricula";
import { useConfigStore } from "@/lib/store/configStore";
import type { BloomLevel, Curriculum, Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

const ALL_BLOOM: BloomLevel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const DIFF_STEPS: Difficulty[] = [1, 2, 3, 4, 5];

export function CurriculumBrowser({ initialCode }: { initialCode?: string | null }) {
  const draft = useConfigStore((s) => s.draft);
  const activeCurriculum = useConfigStore((s) => s.activeCurriculum);
  const setCurriculum = useConfigStore((s) => s.setCurriculum);
  const toggleChapter = useConfigStore((s) => s.toggleChapter);
  const toggleSubtopic = useConfigStore((s) => s.toggleSubtopic);
  const selectSubject = useConfigStore((s) => s.selectSubject);

  const selectedCode = draft.curriculum ?? activeCurriculum ?? (initialCode || null);

  const [query, setQuery] = useState("");
  const [minDiff, setMinDiff] = useState<Difficulty>(1);
  const [maxDiff, setMaxDiff] = useState<Difficulty>(5);
  const [blooms, setBlooms] = useState<BloomLevel[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const curriculum = selectedCode ? CURRICULUM_MAP[selectedCode] : null;

  const filteredSubjects = useMemo(() => {
    if (!curriculum) return [];
    if (!query && !showFilters) return curriculum.subjects;
    const q = query.trim().toLowerCase();
    return curriculum.subjects
      .map((subject) => ({
        ...subject,
        chapters: subject.chapters
          .map((chapter) => ({
            ...chapter,
            subtopics: chapter.subtopics.filter((st) => {
              const okFilters =
                !(st.difficultyBand[1] < minDiff) &&
                !(st.difficultyBand[0] > maxDiff) &&
                (!blooms.length || st.bloomLevels.some((b) => blooms.includes(b)));
              if (showFilters && !okFilters) return false;
              if (!q) return true;
              return (
                st.name.toLowerCase().includes(q) ||
                st.tags.some((t) => t.toLowerCase().includes(q)) ||
                st.learningObjectives.some((lo) => lo.toLowerCase().includes(q))
              );
            }),
          }))
          .filter((chapter) => chapter.subtopics.length > 0),
      }))
      .filter((subject) => subject.chapters.length > 0);
  }, [curriculum, query, minDiff, maxDiff, blooms, showFilters]);

  if (!curriculum) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Choose a curriculum</h1>
          <p className="mt-1 text-muted">Pick an exam board or track to explore its structured topic tree.</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CURRICULA.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurriculum(c.code);
              }}
              className="glass rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 active:scale-[0.99]"
            >
              <h2 className="text-xl font-bold">{c.shortName}</h2>
              <p className="text-xs text-muted">{c.tagline}</p>
              <p className="mt-3 line-clamp-3 text-sm text-muted">{c.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="indigo">{c.subjects.length} subjects</Badge>
                <Badge variant="cyan">
                  {c.subjects.reduce((a, s) => a + s.chapters.length, 0)} chapters
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => setCurriculum(null)}
            className="mb-1 flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4 rotate-180" /> All curricula
          </button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {curriculum.name}
          </h1>
          <p className="text-sm text-muted">{curriculum.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sub-topics…"
              className="h-10 w-52 rounded-xl border border-card-border bg-card/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent/50 sm:w-64"
            />
          </div>
          <Button
            variant={showFilters ? "primary" : "secondary"}
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {showFilters && (
        <GlassCard className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Difficulty band
          </p>
          <div className="mb-1 flex items-center justify-between gap-4">
            {DIFF_STEPS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setMinDiff(d);
                  if (d > maxDiff) setMaxDiff(d);
                }}
                className={cn(
                  "h-8 flex-1 rounded-lg text-xs font-semibold transition-colors",
                  minDiff === d ? "bg-accent text-white" : "bg-foreground/5 text-muted hover:text-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
            Bloom&apos;s level
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_BLOOM.map((b) => (
              <Chip
                key={b}
                label={b}
                active={blooms.includes(b)}
                onClick={() =>
                  setBlooms((s) => (s.includes(b) ? s.filter((x) => x !== b) : [...s, b]))
                }
              />
            ))}
          </div>
        </GlassCard>
      )}

      <AccordionSubjects
        curriculum={curriculum}
        subjects={filteredSubjects}
        selected={draft.subtopicIds}
        selectedChapters={draft.chapterIds}
        expanded={expanded}
        onToggleExpand={toggleExpand}
        onToggleChapter={toggleChapter}
        onToggleSubtopic={toggleSubtopic}
        onSelectSubject={selectSubject}
      />

      {filteredSubjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-card-border p-10 text-center text-sm text-muted">
          No sub-topics match your search or filters.
        </div>
      )}

      {/* Selection bar */}
      <SelectionBar count={draft.subtopicIds.length} />
    </div>
  );
}

function AccordionSubjects({
  curriculum,
  subjects,
  selected,
  selectedChapters,
  expanded,
  onToggleExpand,
  onToggleChapter,
  onToggleSubtopic,
  onSelectSubject,
}: {
  curriculum: Curriculum;
  subjects: Curriculum["subjects"];
  selected: string[];
  selectedChapters: string[];
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleChapter: (chapterId: string, subtopics: string[]) => void;
  onToggleSubtopic: (id: string) => void;
  onSelectSubject: (subjectId: string, subtopics: string[]) => void;
}) {
  void curriculum;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {subjects.map((subject) => {
        const allSubtopics = subject.chapters.flatMap((chx) => chx.subtopics.map((st) => st.id));
        const count = allSubtopics.filter((id) => selected.includes(id)).length;
        const allSelected = count === allSubtopics.length && count > 0;
        return (
          <GlassCard key={subject.id} className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{subject.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="slate" className="whitespace-nowrap">
                  {allSubtopics.length} sub-topics
                </Badge>
                <Button
                  size="sm"
                  variant={allSelected ? "danger" : "secondary"}
                  onClick={() => onSelectSubject(subject.id, allSubtopics)}
                >
                  {allSelected ? <X className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {allSelected ? "Remove all" : "Add all"}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {subject.chapters.map((chapter) => {
                const open = expanded.has(chapter.id);
                const chapterSelected =
                  selectedChapters.includes(chapter.id) ||
                  (chapter.subtopics.length > 0 &&
                    chapter.subtopics.every((st) => selected.includes(st.id)));
                const chapterCount = chapter.subtopics.filter((st) => selected.includes(st.id)).length;
                return (
                  <div key={chapter.id} className="rounded-xl">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleExpand(chapter.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
                        aria-label="Expand chapter"
                      >
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => onToggleChapter(chapter.id, chapter.subtopics.map((st) => st.id))}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors",
                          chapterSelected ? "text-accent" : "hover:bg-foreground/5",
                        )}
                      >
                        {chapterSelected ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                        ) : (
                          <Layers className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        {chapter.name}
                        <span className="ml-auto text-[11px] text-muted">
                          {chapterCount}/{chapter.subtopics.length}
                        </span>
                      </button>
                    </div>

                    {open && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-card-border pb-2 pl-3">
                        {chapter.subtopics.map((st) => {
                          const isSelected = selected.includes(st.id);
                          return (
                            <button
                              key={st.id}
                              onClick={() => onToggleSubtopic(st.id)}
                              className={cn(
                                "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                                isSelected ? "bg-accent/10 text-accent" : "hover:bg-foreground/5",
                              )}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted/60" />
                              )}
                              <span className="min-w-0">
                                <span className="block">{st.name}</span>
                                <span className="block text-[11px] text-muted">
                                  {st.id.startsWith("pd-") ? "" : `${st.tags.slice(0, 3).join(" · ")}`}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function SelectionBar({ count }: { count: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
      <div
        className={cn(
          "glass-strong mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-2xl transition-all",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Layers className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{count} sub-topics selected</p>
            <p className="text-xs text-muted">Optional: adjust scope anytime</p>
          </div>
        </div>
        <Link href="/configure">
          <Button disabled={count === 0}>
            Configure test <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}