"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import type { Question, TutorRequest } from "@/lib/types";
import { deterministicTutorResponse } from "@/lib/ai/tutor";
import { subtopicName } from "@/lib/data/lookup";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

const INTENTS: Array<{ value: TutorRequest["intent"]; label: string }> = [
  { value: "why-wrong", label: "Why was I wrong?" },
  { value: "explain-differently", label: "Explain differently" },
  { value: "similar-easier", label: "Similar, easier" },
  { value: "concept-deep-dive", label: "Deeper concepts" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  engine?: "llm" | "template";
}

export function TutorChat({
  question,
  userAnswerIndex,
  open,
}: {
  question: Question;
  userAnswerIndex?: number;
  open?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (intent: TutorRequest["intent"], prompt?: string) => {
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const request: TutorRequest = { questionId: question.id, intent, prompt, userAnswerIndex, history };

    const local = deterministicTutorResponse(question, request);
    setMessages((m) => [
      ...m,
      ...(prompt ? [{ role: "user" as const, content: prompt }] : []),
      { role: "assistant", content: local, engine: "template" as const },
    ]);
    setBusy(true);
    setInput("");

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: string; engine?: "llm" | "template" };
        if (data.content && data.content !== local) {
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: "assistant", content: data.content!, engine: data.engine ?? "llm" },
          ]);
        }
      }
    } catch {
      // keep deterministic fallback
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Bot className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Tutor · {subtopicName(question.subtopicId)}</p>
          <p className="text-[11px] text-muted">
            Powered by TestCraft explanation engine{process.env.NEXT_PUBLIC_TUTOR_NOTE ? " + AI" : ""}
          </p>
        </div>
        <Sparkles className="ml-auto h-4 w-4 text-accent/50" />
      </div>

      <div ref={scrollRef} className="mb-3 flex max-h-72 flex-col gap-2.5 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="rounded-xl bg-foreground/5 px-3 py-2.5 text-xs text-muted">
            Ask a focused question about this item. I stay scoped to this sub-topic.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2 text-sm",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {m.role === "assistant" && (
              <Bot className="mt-1 h-4 w-4 shrink-0 text-accent" />
            )}
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2.5 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "bg-accent text-white"
                  : "bg-foreground/5",
              )}
            >
              {m.content}
              {m.engine === "llm" && (
                <span className="mt-1 block text-[10px] uppercase tracking-wide text-muted">AI</span>
              )}
            </div>
            {m.role === "user" && <User className="mt-1 h-4 w-4 shrink-0 text-accent" />}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 px-3 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Tutoring…
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {INTENTS.map((i) => (
          <Chip
            key={i.value}
            label={i.label}
            active={false}
            onClick={() => send(i.value)}
            className="text-[11px]"
          />
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !busy) send("freeform", input.trim());
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your own question…"
          className="h-9 w-full rounded-xl border border-card-border bg-card/50 px-3 text-sm outline-none placeholder:text-muted focus:border-accent/50"
        />
        <Button size="icon" disabled={busy || !input.trim()} aria-label="Send" type="submit">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}