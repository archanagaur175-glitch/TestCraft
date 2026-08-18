"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Flag, Loader2 } from "lucide-react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHydrated } from "@/lib/store/useHydrated";
import { CURRICULUM_MAP } from "@/lib/data/curricula";
import { formatTime } from "@/lib/utils";
import { QuestionCard } from "@/components/exam/question-card";
import { Palette, type PaletteItem, type PaletteState } from "@/components/exam/navigator";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function ExamRunner({ sessionId }: { sessionId: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const setAnswer = useSessionStore((s) => s.setAnswer);
  const toggleFlag = useSessionStore((s) => s.toggleFlag);
  const updateTimer = useSessionStore((s) => s.updateTimer);
  const addTimeSpent = useSessionStore((s) => s.addTimeSpent);
  const submitSession = useSessionStore((s) => s.submitSession);

  const [current, setCurrent] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const currentRef = useRef(0);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(i, (session?.questions.length ?? 1) - 1));
    currentRef.current = clamped;
    setCurrent(clamped);
  };

  // Redirect finished papers to the review page.
  useEffect(() => {
    if (session?.status === "submitted") {
      router.replace(`/review/${sessionId}`);
    }
  }, [session?.status, sessionId, router]);

  // Countdown + time-per-question sampling.
  useEffect(() => {
    if (!session || session.status !== "active" || !session.config.timed) return;
    const iv = setInterval(() => {
      const snap = useSessionStore.getState().sessions[sessionId];
      if (!snap || snap.status !== "active") {
        clearInterval(iv);
        return;
      }
      const next = snap.remainingMs - 1000;
      addTimeSpent(sessionId, currentRef.current, 1);
      if (next <= 0) {
        updateTimer(sessionId, 0);
        submitSession(sessionId, true);
        clearInterval(iv);
        router.replace(`/review/${sessionId}`);
      } else {
        updateTimer(sessionId, next);
      }
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Flag className="mx-auto mb-3 h-8 w-8 text-muted" />
        <h1 className="text-xl font-bold">Session not found</h1>
        <p className="mt-1 text-sm text-muted">This exam link may have expired or never existed.</p>
        <div className="mt-5">
          <Link href="/configure">
            <Button>Back to configure</Button>
          </Link>
        </div>
      </div>
    );
  }

  const qs = session.questions;
  const sq = qs[current];
  const answeredCount = qs.filter((x) => answered(x)).length;
  const flaggedCount = qs.filter((x) => x.flagged).length;
  const meta = CURRICULUM_MAP[session.config.selection.curriculum]?.examMeta;
  const sectionLabel = sectionForIndex(current, qs.length, meta?.sections.length ?? 1);

  const paletteItems: PaletteItem[] = qs.map((x, i) => ({
    index: i,
    state: paletteState(x, i === current),
  }));

  const finish = () => {
    submitSession(sessionId);
    router.replace(`/review/${sessionId}`);
  };

  const unanswered = qs.filter((x) => !answered(x)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-16">
      {/* Status bar */}
      <div className="glass-strong sticky top-16 z-30 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{session.config.title}</p>
          <p className="text-xs text-muted">
            Q{current + 1}/{qs.length} · {answeredCount} answered
            {session.config.timed && (
              <>
                {" · "}
                <span className={cn("tabular-nums", session.remainingMs <= 60_000 && "text-destructive")}>
                  {formatTime(Math.ceil(session.remainingMs / 1000))}
                </span>{" "}
                left
              </>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <BadgeGhost>{answeredCount}</BadgeGhost>
          <BadgeGhost amber>F {flaggedCount}</BadgeGhost>
          <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
            Submit test
          </Button>
        </div>
      </div>

      {session.config.mockExam && meta && (
        <p className="pb-0 text-xs text-muted">
          Mock exam on · structure: {meta.structure} · section: {sectionLabel.name}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <QuestionCard
          question={sq.question}
          index={current}
          total={qs.length}
          userAnswerIndex={sq.userAnswerIndex}
          userAnswer={sq.userAnswer}
          flagged={sq.flagged}
          onAnswer={(ai, text) => setAnswer(sessionId, current, ai, text)}
          onToggleFlag={() => toggleFlag(sessionId, current)}
          onNext={() => goTo(current + 1)}
        />

        <Palette
          items={paletteItems}
          currentSectionLabel={session.config.mockExam && meta ? sectionLabel.name : undefined}
          onJump={goTo}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
        />
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Submit test?">
        <p className="text-sm text-muted">
          {unanswered > 0 ? (
            <>
              You still have <strong className="text-foreground">{unanswered} unanswered</strong> question
              {unanswered > 1 ? "s" : ""}. Unanswered items score zero.
            </>
          ) : (
            "All questions are answered. Ready to see your results?"
          )}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Keep writing
          </Button>
          <Button variant="danger" onClick={finish}>
            <AlertTriangle className="h-4 w-4" /> Submit now
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function answered(x: { userAnswer?: string; userAnswerIndex?: number }): boolean {
  if (x.userAnswerIndex !== undefined) return true;
  return typeof x.userAnswer === "string" && x.userAnswer.trim().length > 0;
}

function paletteState(
  x: { userAnswer?: string; userAnswerIndex?: number; flagged: boolean; timeSpentSec: number },
  isCurrent: boolean,
): PaletteState {
  if (isCurrent) return "current";
  if (x.flagged) return "flagged";
  if (answered(x)) return "answered";
  if (x.timeSpentSec > 0) return "seen";
  return "unseen";
}

function sectionForIndex(index: number, total: number, sectionCount: number): { name: string; order: number } {
  const safe = Math.max(sectionCount, 1);
  const per = Math.ceil(total / safe);
  const order = Math.min(Math.floor(index / per), safe - 1);
  return { name: `Section ${order + 1}`, order };
}

function BadgeGhost({ children, amber }: { children: React.ReactNode; amber?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        amber ? "bg-amber-400/20 text-amber-400" : "bg-accent/15 text-accent",
      )}
    >
      {children}
    </span>
  );
}