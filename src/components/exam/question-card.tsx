"use client";

import type { SessionQuestion } from "@/lib/types";
import type { QuestionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function QuestionCard({
  question,
  index,
  total,
  userAnswerIndex,
  userAnswer,
  flagged,
  onAnswer,
  onToggleFlag,
  onNext,
}: {
  question: SessionQuestion["question"];
  index: number;
  total: number;
  userAnswerIndex?: number;
  userAnswer?: string;
  flagged?: boolean;
  onAnswer: (answerIndex: number | undefined, answerText?: string) => void;
  onToggleFlag?: () => void;
  onNext?: () => void;
}) {
  const type = question.type as QuestionType;
  const choiceful = type === "MCQ" || type === "AssertionReason";

  return (
    <div className="glass rounded-2xl p-5 sm:p-7">
      {/* Meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="indigo">Q{index + 1} of {total}</Badge>
        <Badge variant="cyan">{question.type}</Badge>
        <span className="text-xs text-muted">{question.marks} mark{question.marks > 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1 text-xs text-muted">
          <DifficultyDots level={question.difficulty} />
          Difficulty {question.difficulty}/5
        </span>
        <span className="ml-auto text-xs text-muted">{question.bloomLevel}</span>
      </div>

      {/* Stem */}
      <h2 className="text-base font-semibold leading-relaxed sm:text-lg">{question.stem}</h2>
      <p className="mt-1 text-xs text-muted">{question.subtopicId.replace(/[-_]/g, " ")}</p>

      {/* Options */}
      {choiceful ? (
        <div className="mt-6 grid gap-2.5">
          {question.options?.map((opt, i) => (
            <OptionRow
              key={i}
              label={String.fromCharCode(65 + i)}
              text={opt}
              selected={userAnswerIndex === i}
              onSelect={() => onAnswer(i)}
            />
          ))}
        </div>
      ) : question.type === "Numerical" ? (
        <div className="mt-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Your answer (number)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={userAnswer ?? ""}
            placeholder="e.g. 12.5"
            onChange={(e) => onAnswer(undefined, e.target.value)}
            className="w-full max-w-xs rounded-xl border border-card-border bg-card/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent/50"
          />
        </div>
      ) : (
        <div className="mt-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Your answer
          </label>
          <textarea
            value={userAnswer ?? ""}
            rows={5}
            placeholder="Write your answer here…"
            onChange={(e) => onAnswer(undefined, e.target.value)}
            className="w-full resize-y rounded-xl border border-card-border bg-card/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent/50"
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-7 flex items-center justify-between gap-3">
        {onToggleFlag ? (
          <Button variant={flagged ? "danger" : "secondary"} size="sm" onClick={onToggleFlag}>
            {flagged ? "Unflag" : "Flag for review"}
          </Button>
        ) : (
          <span />
        )}
        {onNext && (
          <Button onClick={onNext}>
            {index === total - 1 ? "Finish" : "Next"} →
          </Button>
        )}
      </div>
    </div>
  );
}

function OptionRow({
  label,
  text,
  selected,
  onSelect,
}: {
  label: string;
  text: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-accent bg-accent/10 shadow-sm"
          : "border-card-border hover:border-accent/40 hover:bg-foreground/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          selected ? "border-accent bg-accent text-white" : "border-card-border text-muted",
        )}
      >
        {label}
      </span>
      <span className="text-sm leading-relaxed">{text}</span>
    </button>
  );
}

export function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-end gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= level ? "bg-accent" : "bg-foreground/10",
          )}
        />
      ))}
    </span>
  );
}