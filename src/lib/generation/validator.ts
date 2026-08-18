import type { GenerationOutput, Question } from "@/lib/types";

export type ValidationResult = { ok: boolean; errors: string[] };

export function validateGenerationOutput(
  g: GenerationOutput,
): ValidationResult {
  const errors: string[] = [];
  if (!g.stem || g.stem.trim().length < 8)
    errors.push("stem too short");
  if (g.options && g.options.length < 2)
    errors.push("MCQ requires at least two options");
  if (g.options) {
    if (g.correctIndex == null || g.correctIndex < 0 || g.correctIndex >= g.options.length)
      errors.push("correctIndex out of range");
    else if (g.correctAnswer.trim() !== g.options[g.correctIndex].trim())
      errors.push("correctAnswer must match the option at correctIndex");
    const unique = new Set(g.options.map((o) => o.trim().toLowerCase()));
    if (unique.size !== g.options.length)
      errors.push("options contain duplicates");
    if (g.distractorRationale.length !== g.options.length - 1)
      errors.push("distractorRationale must explain every distractor");
  }
  if (g.options && g.correctIndex == null) errors.push("MCQ missing correctIndex");
  if (!g.options && (!g.correctAnswer || g.correctAnswer.trim().length === 0))
    errors.push("numerical answer missing");
  if (!g.stepByStepExplanation || g.stepByStepExplanation.trim().length < 15)
    errors.push("explanation too short");
  if (g.difficulty < 1 || g.difficulty > 5) errors.push("difficulty out of range");
  if (g.sourceType !== "synthetic") errors.push("invalid sourceType");
  return { ok: errors.length === 0, errors };
}

export function validateQuestion(q: Question): ValidationResult {
  const errors: string[] = [];
  if (!q.id) errors.push("missing id");
  if (!q.stem || q.stem.trim().length < 8) errors.push("stem too short");
  if (q.options) {
    if (q.correctIndex == null || q.correctIndex < 0 || q.correctIndex >= q.options.length)
      errors.push("correctIndex out of range");
    if (q.correctAnswer.trim() !== q.options[q.correctIndex ?? 0]?.trim())
      errors.push("correctAnswer mismatch");
    if (q.distractorRationale.length !== q.options.length - 1)
      errors.push("distractor rationale coverage");
  }
  if (q.difficulty < 1 || q.difficulty > 5) errors.push("difficulty out of range");
  return { ok: errors.length === 0, errors };
}

export function validateBank(questions: Question[]) {
  const failures = questions
    .map((q, i) => ({ q, i, result: validateQuestion(q) }))
    .filter((x) => !x.result.ok);
  return {
    total: questions.length,
    valid: questions.length - failures.length,
    failures: failures.map((f) => ({
      index: f.i,
      id: f.q.id,
      errors: f.result.errors,
    })),
  };
}