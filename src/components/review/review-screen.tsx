"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileDown,
  FileText,
  ListChecks,
  Loader2,
  RefreshCw,
  Target,
  X,
} from "lucide-react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useProfileStore } from "@/lib/store/profileStore";
import { useHydrated } from "@/lib/store/useHydrated";
import { buildAttemptSummary, gradeSession } from "@/lib/scoring/grading";
import { estimateReadiness } from "@/lib/scoring/predictor";
import { exportQuestionPaper } from "@/lib/pdf/paper";
import { subtopicName } from "@/lib/data/lookup";
import { formatTime, formatDate } from "@/lib/utils";
import type { AttemptSummary, Question, SessionQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProgressRing, ScoreBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { TutorChat } from "@/components/review/tutor-chat";

export function ReviewScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const patchQuestion = useSessionStore((s) => s.patchQuestion);
  const recordAttempt = useProfileStore((s) => s.recordAttempt);

  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [pdfBusy, setPdfBusy] = useState<"paper" | "answers" | "key" | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!session || session.status !== "submitted" || recordedRef.current) return;
    recordedRef.current = true;
    const graded = gradeSession(session);
    graded.questions.forEach((sq, i) => {
      patchQuestion(sessionId, i, { correct: sq.correct, scoredMarks: sq.scoredMarks });
    });
    const s = buildAttemptSummary(graded, session.config.selection.curriculum);
    setSummary(s);
    recordAttempt(s, s.mastery);
  }, [session, sessionId, patchQuestion, recordAttempt]);

  const readiness = useMemo(
    () =>
      summary
        ? estimateReadiness({
            attempts: [summary],
            mastery: summary.mastery,
            streaks: { current: 0, best: 0, lastActivityDay: "" },
            studyPlan: [],
          })
        : null,
    [summary],
  );

  const download = async (mode: "paper" | "answers" | "key") => {
    if (!session) return;
    setPdfBusy(mode);
    try {
      const questions: Question[] = session.questions.map((sq) => sq.question);
      const graded = gradeSession(session);
      await exportQuestionPaper(
        mode === "paper"
          ? questions
          : mode === "answers"
            ? graded.questions.filter((sq) => sq.correct).map((sq) => sq.question)
            : questions,
        {
          title: `${session.config.title} — ${mode === "paper" ? "Question Paper" : mode === "answers" ? "Correct Answers Only" : "Answer Key & Explanations"}`,
          curriculum: session.config.selection.curriculum,
          includeAnswerKey: mode === "key",
          includeAnswerSpace: mode === "paper",
          instructionLine: `Instructions: ${session.config.questionCount} questions.${session.config.timed ? ` Time limit: ${session.config.totalMinutes} minutes.` : " Untimed."}`,
        },
      );
    } finally {
      setPdfBusy(null);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-card-border p-10 text-center">
        <X className="mx-auto mb-3 h-8 w-8 text-muted" />
        <h1 className="text-xl font-bold">Review not found</h1>
        <p className="mt-1 text-sm text-muted">No exam with that id exists on this device.</p>
        <div className="mt-5">
          <Link href="/">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (session.status !== "submitted") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-card-border p-10 text-center">
        <ListChecks className="mx-auto mb-3 h-8 w-8 text-muted" />
        <h1 className="text-xl font-bold">Exam in progress</h1>
        <p className="mt-1 text-sm text-muted">You can review results once this paper is submitted.</p>
        <div className="mt-5">
          <Link href={`/exam/${sessionId}`}>
            <Button>Resume exam</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => router.push("/")}
            className="mb-1 flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{session.config.title}</h1>
          <p className="text-sm text-muted">
            {session.config.selection.curriculum} · submitted{" "}
            {formatDate(session.submittedAt ?? session.startedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={pdfBusy !== null} onClick={() => download("paper")}>
            {pdfBusy === "paper" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Paper PDF
          </Button>
          <Button variant="secondary" size="sm" disabled={pdfBusy !== null} onClick={() => download("answers")}>
            {pdfBusy === "answers" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
            Answers PDF
          </Button>
          <Button variant="secondary" size="sm" disabled={pdfBusy !== null} onClick={() => download("key")}>
            {pdfBusy === "key" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Key + Explanations
          </Button>
        </div>
      </header>

      {/* Score summary */}
      {summary && (
        <GlassCard className="p-6">
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center gap-3">
              <ProgressRing
                value={summary.accuracy}
                size={140}
                label={`${Math.round(summary.accuracy)}%`}
                sublabel="accuracy"
              />
              <div className="text-center text-xs text-muted">
                {summary.scoredMarks}/{summary.totalMarks} marks · {summary.correct}/{summary.totalQuestions} correct
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Answered" value={`${summary.answered}/${summary.totalQuestions}`} icon={<Check className="h-4 w-4" />} />
              <Stat label="Time taken" value={formatTime(summary.timeTakenSec)} icon={<Target className="h-4 w-4" />} />
              <Stat
                label="Readiness band"
                value={readiness?.band ?? "—"}
                icon={<Target className="h-4 w-4" />}
                accent
              />
              <Stat
                label="Trend"
                value={readiness?.trend ?? "—"}
                icon={<RefreshCw className="h-4 w-4" />}
              />
            </div>
          </div>

          {summary.breakdown.length > 1 && (
            <div className="mt-6 border-t border-card-border pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">By subject</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {summary.breakdown.map((b) => (
                  <div key={b.subjectId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{b.subjectName}</span>
                      <span className="text-xs text-muted tabular-nums">
                        {b.correct}/{b.attempted} · {Math.round(b.accuracy)}%
                      </span>
                    </div>
                    <ScoreBar value={b.accuracy} color={b.accuracy >= 70 ? "success" : b.accuracy >= 40 ? "warning" : "danger"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.weakSpots.length > 0 && (
            <div className="mt-5 border-t border-card-border pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Weak spots</p>
              <div className="flex flex-wrap gap-2">
                {summary.weakSpots.map((id) => (
                  <Badge key={id} variant="rose">{subtopicName(id)}</Badge>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Question-by-question review */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Question review</h2>
        <div className="space-y-3">
          {session.questions.map((sq, i) => (
            <ReviewItem
              key={i}
              index={i}
              sq={sq}
              expanded={expanded === i}
              onToggle={() => setExpanded(expanded === i ? null : i)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-2">
        <Link href="/">
          <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Dashboard</Button>
        </Link>
        <Link href="/configure">
          <Button><RefreshCw className="h-4 w-4" /> New test</Button>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-card-border p-3", accent && "border-accent/40")}>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accent ? "bg-accent/15 text-accent" : "bg-foreground/5 text-muted")}>
        {icon}
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ReviewItem({
  index,
  sq,
  expanded,
  onToggle,
}: {
  index: number;
  sq: SessionQuestion;
  expanded: boolean;
  onToggle: () => void;
}) {
  const q = sq.question;
  const correct = sq.correct ?? false;
  const chosen = sq.userAnswerIndex != null ? q.options?.[sq.userAnswerIndex] : sq.userAnswer;
  const correctText = q.correctIndex != null ? q.options?.[q.correctIndex] : q.correctAnswer;

  return (
    <GlassCard className="p-4 sm:p-5">
      <button onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
            correct ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500",
          )}
        >
          {correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="indigo">Q{index + 1}</Badge>
            <Badge variant={correct ? "emerald" : "rose"}>{correct ? "Correct" : "Incorrect"}</Badge>
            <span className="text-xs text-muted">{q.type} · diff {q.difficulty}/5</span>
            <Badge variant={q.sourceType === "public-domain" ? "slate" : "cyan"}>
              {q.sourceType === "public-domain" ? "public-domain" : "synthetic"}
            </Badge>
          </div>
          <p className="text-sm font-medium leading-relaxed">{q.stem}</p>
          <p className="mt-0.5 text-xs text-muted">{subtopicName(q.subtopicId)}</p>
        </div>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-card-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Your answer</p>
              <p className={cn("text-sm", correct ? "text-emerald-500" : "text-rose-500")}>
                {chosen ? chosen : <span className="text-muted">Not answered</span>}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-500">Correct answer</p>
              <p className="text-sm">{correctText}</p>
            </div>
          </div>

          {!correct && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Why this trap</p>
              <ul className="space-y-1 text-sm text-muted">
                {q.distractorRationale.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Step-by-step explanation</p>
            <p className="whitespace-pre-wrap rounded-xl bg-foreground/5 p-3 text-sm leading-relaxed">
              {q.stepByStepExplanation}
            </p>
          </div>

          <TutorChat question={q} userAnswerIndex={sq.userAnswerIndex} open={expanded} />
        </div>
      )}
    </GlassCard>
  );
}