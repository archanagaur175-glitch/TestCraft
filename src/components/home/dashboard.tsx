"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Compass,
  Flame,
  FileText,
  Gauge,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing, ScoreBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useProfileStore } from "@/lib/store/profileStore";
import { useHydrated } from "@/lib/store/useHydrated";
import { estimateReadiness } from "@/lib/scoring/predictor";
import { CURRICULA } from "@/lib/data/curricula";
import { formatDate, pct } from "@/lib/utils";

const curriculumGradient = [
  "from-indigo-500/20 to-sky-500/10",
  "from-rose-500/20 to-orange-500/10",
  "from-amber-500/20 to-yellow-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-violet-500/20 to-fuchsia-500/10",
  "from-cyan-500/20 to-blue-500/10",
];

export function Dashboard() {
  const hydrated = useHydrated();
  const profile = useProfileStore((s) => s.profile);

  if (!hydrated) return <Spinner />;

  const estimate = estimateReadiness(profile);
  const lastAttempt = profile.attempts[0];

  const avgAccuracy = profile.attempts.length
    ? pct(
        profile.attempts.reduce((a, t) => a + t.correct, 0),
        profile.attempts.reduce((a, t) => a + t.totalQuestions, 0),
      )
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-10">
        <div className="blob left-[-60px] top-[-80px] h-64 w-64 bg-accent/40" />
        <div className="blob right-[-40px] top-24 h-52 w-52 bg-accent-2/30" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Badge variant="indigo" className="mb-3">
              <Sparkles className="h-3 w-3" />
              Adaptive · AI-tutored · Exam-realistic
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Craft tests that turn{" "}
              <span className="gradient-text">weak spots</span> into strengths.
            </h1>
            <p className="mt-4 text-muted sm:text-lg">
              Build custom papers across CBSE, ICSE, JEE, NEET, SAT and university modules —
              graded instantly, explained per mistake, exported as crisp selectable PDFs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/curriculum">
                <Button size="lg">
                  <Compass className="h-5 w-5" />
                  Create a test
                </Button>
              </Link>
              <Link href="/analytics">
                <Button size="lg" variant="secondary">
                  <BarChart3 className="h-5 w-5" />
                  View analytics
                </Button>
              </Link>
            </div>
          </div>

          <GlassCard glow className="w-full max-w-xs p-6 lg:shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Readiness</span>
              <span className="text-xs uppercase tracking-wide text-muted">
                {estimate.band}
              </span>
            </div>
            <div className="mt-3 flex justify-center">
              <ProgressRing
                value={estimate.percentile}
                label={`${estimate.percentile}%`}
                sublabel="projected"
              />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" />
                {estimate.confidence} confidence
              </span>
              <span className="flex items-center gap-1.5 capitalize">
                <TrendingUp className="h-3.5 w-3.5" />
                {estimate.trend}
              </span>
            </div>
            {lastAttempt && (
              <p className="mt-3 text-xs text-muted">
                Last test: <span className="font-medium text-foreground">{lastAttempt.configTitle}</span> ·{" "}
                {formatDate(lastAttempt.completedAt)}
              </p>
            )}
          </GlassCard>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: BookOpenCheck,
            label: "Tests taken",
            value: profile.attempts.length,
            accent: "text-accent",
          },
          {
            icon: Flame,
            label: "Day streak",
            value: profile.streaks.current,
            accent: "text-warning",
          },
          {
            icon: Target,
            label: "Accuracy",
            value: `${avgAccuracy}%`,
            accent: "text-success",
          },
          {
            icon: Gauge,
            label: "Best band",
            value: estimate.band,
            accent: "text-accent-2",
          },
        ].map((stat) => (
          <GlassCard key={stat.label} className="p-5">
            <div className="flex items-center gap-3">
              <span className={`rounded-xl bg-foreground/5 p-2.5 ${stat.accent}`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs text-muted">{stat.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* Curriculum grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose a curriculum</h2>
          <Link href="/curriculum" className="flex items-center gap-1 text-sm text-accent hover:underline">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CURRICULA.map((c, i) => (
            <Link key={c.code} href={`/curriculum?code=${c.code}`}>
              <GlassCard interactive className="h-full p-5">
                <div
                  className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${curriculumGradient[i % curriculumGradient.length]} p-2.5`}
                >
                  <BookOpenCheck className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold">{c.shortName}</h3>
                <p className="mt-0.5 text-xs text-muted">{c.tagline}</p>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{c.description}</p>
                <div className="mt-4 flex gap-2 text-[11px] text-muted">
                  <Badge variant="slate">{c.subjects.length} subjects</Badge>
                  <Badge variant="slate">
                    {c.subjects.reduce((a, s) => a + s.chapters.length, 0)} chapters
                  </Badge>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent attempts + study plan teaser */}
      <section className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Recent attempts</h2>
          </div>
          {profile.attempts.length === 0 ? (
            <EmptyState
              title="No attempts yet"
              body="Create your first test to start building a readiness picture."
              ctaHref="/curriculum"
              ctaLabel="Create a test"
            />
          ) : (
            <ul className="space-y-3">
              {profile.attempts.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link href={`/review/${a.id}`} className="block rounded-xl p-3 transition-colors hover:bg-foreground/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.configTitle}</p>
                        <p className="text-xs text-muted">
                          {a.totalQuestions} questions · {formatDate(a.completedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={a.accuracy >= 60 ? "emerald" : a.accuracy >= 40 ? "amber" : "rose"}>
                          {a.accuracy}%
                        </Badge>
                        <span className="text-xs text-accent">{a.scoredMarks}/{a.totalMarks}</span>
                      </div>
                    </div>
                    <ScoreBar value={a.accuracy} color={a.accuracy >= 60 ? "success" : "warning"} className="mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-accent-2" />
            <h2 className="font-semibold">Suggested next steps</h2>
          </div>
          {profile.studyPlan.length === 0 ? (
            <EmptyState
              title="Your plan is forming"
              body="Finish a test and TestCraft will build targeted drills from the sub-topics you missed."
              ctaHref="/sourcing"
              ctaLabel="Understand sourcing"
            />
          ) : (
            <ul className="space-y-3">
              {profile.studyPlan.slice(0, 4).map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl bg-foreground/5 p-3"
                >
                  <span
                    className={
                      p.priority === "high"
                        ? "mt-1 rounded-lg bg-danger/15 p-1.5 text-danger"
                        : "mt-1 rounded-lg bg-warning/15 p-1.5 text-warning"
                    }
                  >
                    <Target className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.subtopicName}</p>
                    <p className="text-xs text-muted">{p.action}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>
    </div>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-card-border py-8 text-center">
      <Sparkles className="h-6 w-6 text-muted" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted">{body}</p>
      <Link href={ctaHref} className="mt-2">
        <Button size="sm" variant="secondary">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}