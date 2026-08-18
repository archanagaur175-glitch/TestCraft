import {
  BANK_BY_CURRICULUM,
  QUESTION_BANK,
} from "@/lib/data/questions";
import type {
  Difficulty,
  DifficultyMix,
  Question,
  QuestionType,
  SessionQuestion,
  TestConfig,
  TopicMastery,
} from "@/lib/types";

export interface QuestionFilters {
  curriculum?: string;
  subjectId?: string;
  chapterIds?: string[];
  subtopicIds?: string[];
  types?: QuestionType[];
  minDifficulty?: Difficulty;
  maxDifficulty?: Difficulty;
  sources?: Array<"synthetic" | "public-domain">;
  excludeIds?: string[];
}

export function filterQuestions(
  bank: Question[],
  filters: QuestionFilters,
): Question[] {
  return bank.filter((q) => {
    if (filters.curriculum && q.curriculum !== filters.curriculum) return false;
    if (filters.subjectId && q.subjectId !== filters.subjectId) return false;
    if (filters.chapterIds?.length && !filters.chapterIds.includes(q.chapterId)) return false;
    if (filters.subtopicIds?.length && !filters.subtopicIds.includes(q.subtopicId)) return false;
    if (filters.types?.length && !filters.types.includes(q.type)) return false;
    if (filters.minDifficulty && q.difficulty < filters.minDifficulty) return false;
    if (filters.maxDifficulty && q.difficulty > filters.maxDifficulty) return false;
    if (filters.sources?.length && !filters.sources.includes(q.sourceType)) return false;
    if (filters.excludeIds?.includes(q.id)) return false;
    return true;
  });
}

export function sourcesFromLane(
  lane: TestConfig["sourceLane"],
): Array<"synthetic" | "public-domain"> {
  if (lane === "mixed") return ["synthetic", "public-domain"];
  return [lane];
}

export function pickBalanced(
  candidates: Question[],
  count: number,
  difficultyMix: DifficultyMix,
  seed = Math.random(),
): Question[] {
  const picked: Question[] = [];
  const pool = [...candidates];
  const shuffled = pool.sort(() => Math.random() - 0.5 + (seed * 2 - 1) * 0.2);
  // First pass: respect the requested difficulty mix.
  for (const d of [5, 4, 3, 2, 1] as Difficulty[]) {
    const need = Math.round((difficultyMix[d] / 100) * count);
    if (need <= 0) continue;
    const bucket = shuffled.filter((q) => q.difficulty === d);
    picked.push(...bucket.slice(0, need));
  }
  // Second pass: fill any remaining slots with whatever is left.
  let i = 0;
  while (picked.length < count && i < shuffled.length) {
    const q = shuffled[i];
    if (!picked.includes(q)) picked.push(q);
    i++;
  }
  return picked;
}

export function assembleQuestions(
  config: TestConfig,
  options?: { adaptiveProfile?: TopicMastery[] },
): Question[] {
  const filters: QuestionFilters = {
    curriculum: config.selection.curriculum,
    subjectId: config.selection.subjectId,
    chapterIds: config.selection.chapterIds,
    subtopicIds: config.selection.subtopicIds,
    types: config.questionTypes,
    sources: sourcesFromLane(config.sourceLane),
  };

  let candidates = filterQuestions(QUESTION_BANK, filters);

  // Adaptive scaling: weak topics get foundational difficulty items first so the
  // learner can rebuild understanding before being challenged.
  if (config.adaptive && options?.adaptiveProfile?.length) {
    const profileBySubtopic = new Map(
      options.adaptiveProfile.map((m) => [m.subtopicId, m]),
    );
    const weaknessScore = (q: Question) => {
      const m = profileBySubtopic.get(q.subtopicId);
      if (!m || m.attempts < 2) return 0.5;
      return m.accuracy < 0.5 ? 1 : m.accuracy > 0.85 ? -1 : 0;
    };
    candidates = candidates
      .map((q) => ({ q, weak: weaknessScore(q) }))
      .sort((a, b) => b.weak - a.weak)
      .map((x) => x.q);
  }

  const picked = pickBalanced(candidates, config.questionCount, config.difficultyMix);

  // Fallback: relax source restriction if the strict bank can't fill the paper.
  if (picked.length < config.questionCount) {
    const relaxed = pickBalanced(
      filterQuestions(QUESTION_BANK, { ...filters, sources: undefined }),
      config.questionCount,
      config.difficultyMix,
    );
    return relaxed;
  }

  return picked;
}

export function toSessionQuestions(questions: Question[]): SessionQuestion[] {
  return questions.map((question) => ({
    question,
    flagged: false,
    timeSpentSec: 0,
    scoredMarks: 0,
  }));
}

export { BANK_BY_CURRICULUM };

export type { Difficulty, Question };