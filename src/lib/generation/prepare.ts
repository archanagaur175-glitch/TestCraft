import type {
  BloomLevel,
  CurriculumCode,
  Difficulty,
  DifficultyMix,
  Question,
  TestConfig,
} from "@/lib/types";
import { CURRICULUM_MAP } from "@/lib/data/curricula";
import { assembleQuestions } from "@/lib/questions/engine";
import { requestGeneratedQuestions } from "@/lib/generation/service";
import {
  buildTestConfig,
  defaultOptions,
  type TestDraft,
  type TestOptions,
} from "@/lib/store/configStore";

export interface PreparedPaper {
  config: TestConfig;
  questions: Question[];
  engine: "bank" | "llm" | "template";
  rateLimited?: boolean;
}

export interface ResolvedNode {
  curriculum: CurriculumCode;
  subjectId: string;
  chapterId: string;
  name: string;
}

export function resolveNode(subtopicId: string): ResolvedNode | undefined {
  for (const c of Object.values(CURRICULUM_MAP)) {
    for (const s of c.subjects) {
      for (const chx of s.chapters) {
        const t = chx.subtopics.find((x) => x.id === subtopicId);
        if (t) {
          return {
            curriculum: c.code,
            subjectId: s.id,
            chapterId: chx.id,
            name: t.name,
          };
        }
      }
    }
  }
  return undefined;
}

const BLOOM_STYLE: Record<BloomLevel, string> = {
  Remember: "Recall",
  Understand: "Explain",
  Apply: "Compute",
  Analyze: "Analyse",
  Evaluate: "Evaluate",
  Create: "Design",
};

/** Weighted difficulty pick honouring the user's percentage mix. */
export function pickDifficulty(
  mix: DifficultyMix,
  index: number,
): Difficulty {
  const entries = (Object.entries(mix) as Array<[string, number]>)
    .map(([d, pct]) => ({ d: Number(d) as Difficulty, pct }))
    .sort((a, b) => a.d - b.d);
  const total = entries.reduce((a, e) => a + e.pct, 0) || 100;
  let acc = 0;
  const r = ((index * 37 + 13) % 100) / 100;
  for (const e of entries) {
    acc += e.pct / total;
    if (r <= acc) return e.d;
  }
  return 3;
}

/**
 * Build a paper: seeded bank questions first (respecting source lane), then
 * top-up any shortfall with generated questions (LLM with template fallback).
 */
export async function preparePaper(
  draft: TestDraft,
  options: TestOptions,
  title: string,
): Promise<PreparedPaper> {
  const config = buildTestConfig(draft, options, title);
  const bank = uniqueById(assembleQuestions(config)).slice(0, config.questionCount);

  if (bank.length >= config.questionCount) {
    return { config, questions: bank, engine: "bank" };
  }

  const deficit = config.questionCount - bank.length;
  const subtopicIds = draft.subtopicIds.length ? draft.subtopicIds : fallbackSubtopicIds(config);
  if (subtopicIds.length === 0) {
    return { config, questions: bank, engine: "bank" };
  }

  const generated: Question[] = [];
  let llmUsed = false;
  let rateLimited = false;

  // Round-robin across sub-topics so every selected node contributes.
  let produced = 0;
  let round = 0;
  const perRound = Math.max(Math.round(deficit / subtopicIds.length), 1);
  while (produced < deficit && round < subtopicIds.length * ((deficit / perRound) + 2)) {
    const subtopicId = subtopicIds[round % subtopicIds.length];
    const node = resolveNode(subtopicId);
    if (node) {
      const want = Math.min(perRound, Math.max(deficit - produced, 0));
      if (want > 0) {
        const result = await requestGeneratedQuestions({
          curriculum: node.curriculum,
          subjectId: node.subjectId,
          chapterId: node.chapterId,
          subtopicId,
          bloomLevel: ringBloom(config, produced),
          questionType: ringType(config, produced % subtopicIds.length),
          difficulty: pickDifficulty(config.difficultyMix, produced),
          commandWordStyle: BLOOM_STYLE[ringBloom(config, produced)],
          count: want,
        });
        generated.push(...result.questions);
        llmUsed = llmUsed || result.engine === "llm";
        rateLimited = rateLimited || !!result.rateLimited;
        // Ensure produced advances even if the request returned nothing.
        produced += want;
      }
    }
    round++;
  }

  const merged = uniqueById([...bank, ...generated]).slice(0, config.questionCount);

  if (merged.length < config.questionCount && llmUsed) {
    // Search-only fallback: relax the source lane for a full bank paper.
    const relaxed = uniqueById(
      assembleQuestions({ ...config, sourceLane: "mixed" }),
    ).slice(0, config.questionCount);
    if (relaxed.length > merged.length) {
      return { config, questions: relaxed, engine: "bank" };
    }
  }

  return {
    config,
    questions: merged,
    engine: llmUsed ? "llm" : "template",
    rateLimited,
  };
}

function fallbackSubtopicIds(config: TestConfig): string[] {
  const c = CURRICULUM_MAP[config.selection.curriculum];
  if (!c) return [];
  const ids: string[] = [];
  for (const s of c.subjects.slice(0, 2)) {
    for (const chx of s.chapters.slice(0, 2)) {
      for (const st of chx.subtopics) ids.push(st.id);
    }
  }
  return ids;
}

function ringBloom(config: TestConfig, index: number): BloomLevel {
  if (config.selection.subtopicIds.length) return "Understand";
  const levels: BloomLevel[] = ["Remember", "Understand", "Apply", "Analyze"];
  return levels[index % levels.length];
}

function ringType(config: TestConfig, index: number): import("@/lib/types").QuestionType {
  const pool = config.questionTypes.length ? config.questionTypes : defaultOptions().questionTypes;
  return pool[index % pool.length];
}

function uniqueById(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of questions) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}