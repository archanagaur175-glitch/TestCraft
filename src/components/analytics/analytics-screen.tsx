"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, CalendarCheck, RotateCcw, Target, TrendingUp } from "lucide-react";
import { useProfileStore } from "@/lib/store/profileStore";
import { useHydrated } from "@/lib/store/useHydrated";
import { estimateReadiness, readinessGoalHint } from "@/lib/scoring/predictor";
import { subtopicName, curriculumName } from "@/lib/data/lookup";
import { formatDate, formatTime } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function AnalyticsScreen() {
  const hydrated = useHydrated();
  const profile = useProfileStore((s) => s.profile);
  const resetProfile = useProfileStore((s) => s.resetProfile);
  const [confirmReset, setConfirmReset] = useState(false);

  const estimate = useMemo(() => (profile.attempts.length ? estimateReadiness(profile) : null), [profile]);

  const subjects = useMemo(() => {
    const map = new Map<string, { name: string; acc: number; count: number; correct: number }>();
    for (const m of profile.mastery) {
      const cur = map.get(m.subjectId) ?? { name: m.subjectId, acc: 0, count: 0, correct: 0 };
      cur.count += m.attempts;
      cur.correct += m.correct;
      map.set(m.subjectId, cur);
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      accuracy: v.count ? Math.round((v.correct / v.count) * 100) : 0,
    }));
  }, [profile.mastery]);

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Your readiness, mastery and study plan across all attempts.</p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => { resetProfile(); setConfirmReset(false); }}>
              <RotateCcw className="h-4 w-4" /> Confirm reset
            </Button>
          </div>
        ) : (
          profile.attempts.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" /> Reset data
            </Button>
          )
        )}
      </header>

      {!profile.attempts.length ? (
        <GlassCard className="p-10 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted" />
          <h2 className="text-lg font-semibold">No attempts recorded yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Take your first test and your score history, mastery map and study plan will appear here.
          </p>
          <div className="mt-5">
            <Link href="/configure">
              <Button>Start a test</Button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Readiness */}
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Target className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Readiness band</p>
                <p className="text-3xl font-bold tracking-tight">{estimate?.band ?? "—"}</p>
                <p className="mt-1 text-sm text-muted">
                  ~{estimate?.percentile}th percentile · confidence {estimate?.confidence} · trend{" "}
                  <span className={cn(estimate?.trend === "improving" && "text-emerald-500", estimate?.trend === "declining" && "text-rose-500")}>
                    {estimate?.trend}
                  </span>
                </p>
              </div>
              <Badge variant="indigo" className="ml-auto hidden sm:inline-flex">
                {estimate ? readinessGoalHint(estimate) : ""}
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Attempts" value={String(profile.attempts.length)} />
              <MiniStat label="Streak" value={`${profile.streaks.current} day${profile.streaks.current === 1 ? "" : "s"}`} />
              <MiniStat label="Best streak" value={`${profile.streaks.best}`} />
            </div>
          </GlassCard>

          {/* Mastery */}
          <GlassCard className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-4 w-4 text-accent" /> Subject mastery
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {subjects.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted tabular-nums">{s.accuracy}%</span>
                  </div>
                  <ScoreBar value={s.accuracy} color={s.accuracy >= 70 ? "success" : s.accuracy >= 40 ? "warning" : "danger"} />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Study plan */}
          {profile.studyPlan.length > 0 && (
            <GlassCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-accent" /> Suggested study plan
              </h2>
              <ul className="space-y-3">
                {profile.studyPlan.map((p) => (
                  <li key={p.id} className="flex gap-3 rounded-xl border border-card-border p-3">
                    <PriorityDot priority={p.priority} />
                    <div>
                      <p className="text-sm font-medium">{p.subtopicName}</p>
                      <p className="text-xs text-muted">{p.reason}</p>
                      <p className="mt-1 text-xs text-accent">{p.action}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* History */}
          <GlassCard className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <CalendarCheck className="h-4 w-4 text-accent" /> Attempt history
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 pr-4 font-semibold">Test</th>
                    <th className="pb-2 pr-4 font-semibold">Date</th>
                    <th className="pb-2 pr-4 font-semibold">Accuracy</th>
                    <th className="pb-2 pr-4 font-semibold">Marks</th>
                    <th className="pb-2 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.attempts.map((a) => (
                    <tr key={a.id} className="border-b border-card-border/60 last:border-0">
                      <td className="max-w-[260px] py-2.5 pr-4">
                        <Link href={`/review/${a.id}`} className="block truncate font-medium hover:text-accent">
                          {a.configTitle}
                        </Link>
                        <span className="text-xs text-muted">{curriculumName(a.curriculum)}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-muted">{formatDate(a.completedAt)}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn("font-semibold tabular-nums", a.accuracy >= 70 ? "text-emerald-500" : a.accuracy >= 40 ? "text-amber-500" : "text-rose-500")}>
                          {Math.round(a.accuracy)}%
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-muted">{a.scoredMarks}/{a.totalMarks}</td>
                      <td className="py-2.5 tabular-nums text-muted">{formatTime(a.timeTakenSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Mastery detail */}
          {profile.mastery.length > 0 && (
            <GlassCard className="p-6">
              <h2 className="mb-4 text-base font-semibold">Sub-topic mastery</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {profile.mastery
                  .slice()
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .map((m) => (
                    <div key={m.subtopicId} className="rounded-xl border border-card-border p-3">
                      <p className="truncate text-sm font-medium">{subtopicName(m.subtopicId)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <ScoreBar value={m.accuracy} className="flex-1" color={m.accuracy >= 70 ? "success" : m.accuracy >= 40 ? "warning" : "danger"} />
                        <span className="text-xs tabular-nums text-muted">{Math.round(m.accuracy)}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{m.attempts} attempt{m.attempts === 1 ? "" : "s"} · avg difficulty {m.avgDifficulty}/5</p>
                    </div>
                  ))}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border p-3 text-center">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function PriorityDot({ priority }: { priority: "high" | "medium" | "low" }) {
  return (
    <span
      className={cn(
        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
        priority === "high" && "bg-rose-500",
        priority === "medium" && "bg-amber-400",
        priority === "low" && "bg-emerald-500",
      )}
    />
  );
}