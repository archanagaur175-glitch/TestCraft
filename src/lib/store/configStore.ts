"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CurriculumCode,
  DifficultyMix,
  QuestionType,
  SourceLane,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export interface TestDraft {
  curriculum: CurriculumCode | null;
  subjectId?: string;
  chapterIds: string[];
  subtopicIds: string[];
}

export interface TestOptions {
  questionCount: number;
  questionTypes: QuestionType[];
  difficultyMix: DifficultyMix;
  timed: boolean;
  totalMinutes: number;
  sourceLane: SourceLane | "mixed";
  mockExam: boolean;
  adaptive: boolean;
}

export const DEFAULT_DIFFICULTY_MIX: DifficultyMix = {
  1: 20,
  2: 25,
  3: 25,
  4: 20,
  5: 10,
};

const DEFAULT_OPTIONS: TestOptions = {
  questionCount: 10,
  questionTypes: ["MCQ", "Numerical", "AssertionReason"],
  difficultyMix: DEFAULT_DIFFICULTY_MIX,
  timed: true,
  totalMinutes: 30,
  sourceLane: "mixed",
  mockExam: false,
  adaptive: true,
};

interface ConfigState {
  draft: TestDraft;
  options: TestOptions;
  activeCurriculum: CurriculumCode | null;
  setCurriculum: (code: CurriculumCode | null) => void;
  toggleChapter: (chapterId: string, subtopicIds: string[]) => void;
  toggleSubtopic: (subtopicId: string) => void;
  selectSubject: (subjectId: string, allSubtopics: string[]) => void;
  clearSelection: () => void;
  setOptions: (patch: Partial<TestOptions>) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      draft: {
        curriculum: null,
        chapterIds: [],
        subtopicIds: [],
      },
      options: DEFAULT_OPTIONS,
      activeCurriculum: null,
      setCurriculum: (code) =>
        set(() => ({
          activeCurriculum: code,
          draft: { curriculum: code, subjectId: undefined, chapterIds: [], subtopicIds: [] },
        })),
      toggleChapter: (chapterId, subtopicIds) =>
        set((s) => {
          const has = s.draft.chapterIds.includes(chapterId);
          const chapterIds = has
            ? s.draft.chapterIds.filter((c) => c !== chapterId)
            : [...s.draft.chapterIds, chapterId];
          const subtopicIdsSet = new Set(s.draft.subtopicIds);
          for (const st of subtopicIds) {
            if (has) subtopicIdsSet.delete(st);
            else subtopicIdsSet.add(st);
          }
          return {
            draft: {
              ...s.draft,
              chapterIds,
              subtopicIds: Array.from(subtopicIdsSet),
            },
          };
        }),
      toggleSubtopic: (subtopicId) =>
        set((s) => {
          const subtopicIds = s.draft.subtopicIds.includes(subtopicId)
            ? s.draft.subtopicIds.filter((t) => t !== subtopicId)
            : [...s.draft.subtopicIds, subtopicId];
          return {
            draft: { ...s.draft, subtopicIds },
          };
        }),
      selectSubject: (subjectId, allSubtopics) =>
        set((s) => ({
          draft: {
            ...s.draft,
            subjectId,
            chapterIds: [],
            subtopicIds: allSubtopics,
          },
        })),
      clearSelection: () =>
        set((s) => ({
          draft: { ...s.draft, subjectId: undefined, chapterIds: [], subtopicIds: [] },
        })),
      setOptions: (patch) =>
        set((s) => ({ options: { ...s.options, ...patch } })),
      reset: () => set({ draft: { curriculum: null, chapterIds: [], subtopicIds: [] }, options: DEFAULT_OPTIONS }),
    }),
    {
      name: "testcraft-config",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function nextQuestionTypes(
  current: QuestionType[],
  type: QuestionType,
): QuestionType[] {
  return current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
}

/**
 * Create a fully-resolved TestConfig from the current draft + options.
 * The caller supplies a resolved node title for human-friendly naming.
 */
export function buildTestConfig(
  draft: TestDraft,
  options: TestOptions,
  title: string,
): import("@/lib/types").TestConfig {
  const now = Date.now();
  return {
    id: uid("tcfg"),
    title,
    selection: {
      curriculum: draft.curriculum ?? "CBSE",
      subjectId: draft.subjectId,
      chapterIds: draft.chapterIds,
      subtopicIds: draft.subtopicIds,
    },
    questionCount: options.questionCount,
    questionTypes: options.questionTypes,
    difficultyMix: options.difficultyMix,
    timed: options.timed,
    totalMinutes: options.totalMinutes,
    sourceLane: options.sourceLane,
    mockExam: options.mockExam,
    adaptive: options.adaptive,
    createdAt: now,
  };
}

export function defaultOptions(): TestOptions {
  return { ...DEFAULT_OPTIONS, difficultyMix: { ...DEFAULT_DIFFICULTY_MIX } };
}