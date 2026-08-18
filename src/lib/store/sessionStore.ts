"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ExamSession, Question, SessionQuestion, TestConfig } from "@/lib/types";
import { toSessionQuestions } from "@/lib/questions/engine";
import { uid } from "@/lib/utils";

interface SessionState {
  sessions: Record<string, ExamSession>;
  createSession: (
    config: TestConfig,
    questions: Question[],
    remainingMs: number,
  ) => string;
  setAnswer: (
    sessionId: string,
    index: number,
    answerIndex: number | undefined,
    answerText?: string,
  ) => void;
  toggleFlag: (sessionId: string, index: number) => void;
  updateTimer: (sessionId: string, remainingMs: number) => void;
  addTimeSpent: (sessionId: string, index: number, sec: number) => void;
  patchQuestion: (sessionId: string, index: number, patch: Partial<SessionQuestion>) => void;
  submitSession: (sessionId: string, auto?: boolean) => void;
  getSession: (sessionId: string) => ExamSession | undefined;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: {},
      createSession(config, questions, remainingMs) {
        const id = uid("exam");
        const session: ExamSession = {
          id,
          config,
          questions: toSessionQuestions(questions),
          startedAt: Date.now(),
          remainingMs,
          activeSectionIndex: 0,
          status: "active",
        };
        set((s) => ({ sessions: { ...s.sessions, [id]: session } }));
        return id;
      },
      setAnswer(sessionId, index, answerIndex, answerText) {
        set((s) => {
          const session = s.sessions[sessionId];
          if (!session) return s;
          const question = session.questions[index];
          if (!question) return s;
          const updated = [...session.questions];
          updated[index] = {
            ...question,
            userAnswerIndex: answerIndex,
            userAnswer: answerText ?? question.userAnswer,
          };
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...session, questions: updated },
            },
          };
        });
      },
      toggleFlag(sessionId, index) {
        set((s) => {
          const session = s.sessions[sessionId];
          if (!session) return s;
          const question = session.questions[index];
          if (!question) return s;
          const updated = [...session.questions];
          updated[index] = { ...question, flagged: !question.flagged };
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...session, questions: updated },
            },
          };
        });
      },
      updateTimer(sessionId, remainingMs) {
        set((s) => {
          const session = s.sessions[sessionId];
          if (!session || session.status !== "active") return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...session, remainingMs },
            },
          };
        });
      },
      addTimeSpent(sessionId, index, sec) {
        set((s) => {
          const session = s.sessions[sessionId];
          if (!session) return s;
          const question = session.questions[index];
          if (!question) return s;
          const updated = [...session.questions];
          updated[index] = { ...question, timeSpentSec: question.timeSpentSec + sec };
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...session, questions: updated },
            },
          };
        });
      },
      patchQuestion(sessionId, index, patch) {
        set((s) => {
          const session = s.sessions[sessionId];
          if (!session) return s;
          const question = session.questions[index];
          if (!question) return s;
          const updated = [...session.questions];
          updated[index] = { ...question, ...patch };
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...session, questions: updated },
            },
          };
        });
      },
      submitSession(sessionId, auto = false) {
        set((s) => {
          const session = s.sessions[sessionId];
          if (!session) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: {
                ...session,
                status: "submitted",
                submittedAt: Date.now(),
                autoSubmitted: auto,
              },
            },
          };
        });
      },
      getSession(sessionId) {
        return get().sessions[sessionId];
      },
    }),
    {
      name: "testcraft-sessions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function newSessionId(): string {
  return uid("exam");
}