import type { GenerationInput, Question } from "@/lib/types";
import { generateSynthetic, generationOutputToQuestion } from "@/lib/generation/templateEngine";
import { validateGenerationOutput } from "@/lib/generation/validator";

export interface GenerationResult {
  questions: Question[];
  engine: "llm" | "template";
  rateLimited?: boolean;
}

export async function requestGeneratedQuestions(
  input: GenerationInput,
): Promise<GenerationResult> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      return {
        questions: generateLocally(input),
        engine: "template",
        rateLimited: res.status === 429,
      };
    }

    const data = (await res.json()) as {
      items?: Array<Parameters<typeof generationOutputToQuestion>[1]>;
      engine?: "llm" | "template";
    };

    const valid = (data.items ?? [])
      .filter((g) => validateGenerationOutput(g).ok)
      .map((g) => generationOutputToQuestion(input, g, 0));

    if (valid.length === 0) {
      return { questions: generateLocally(input), engine: "template" };
    }
    return { questions: valid, engine: data.engine ?? "template" };
  } catch {
    return { questions: generateLocally(input), engine: "template" };
  }
}

function generateLocally(input: GenerationInput): Question[] {
  return generateSynthetic(input)
    .filter((g) => validateGenerationOutput(g).ok)
    .map((g, i) => generationOutputToQuestion(input, g, i));
}