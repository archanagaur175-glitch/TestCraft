import type { GenerationInput, GenerationOutput } from "@/lib/types";
import { validateGenerationOutput } from "@/lib/generation/validator";

const SYSTEM_PROMPT = `You are the TestCraft question-generation engine. Produce wholly original exam questions grounded only in topic metadata.
NEVER reproduce copyrightable text from existing question banks, textbooks or past papers. All content must be authored from scratch.

Return a JSON object: { "items": [ ... ] } where each item strictly matches:
{
  "stem": string,
  "options": string[] | null,     // 4 options for MCQ; null for Numerical/Short/Long
  "correctIndex": number | null,  // index of correct option for MCQ; null otherwise
  "correctAnswer": string,        // for Numerical: the numeric value with unit
  "distractorRationale": string[],// one entry explaining each distractor's plausible-but-wrong reasoning (may be [] when no options)
  "stepByStepExplanation": string,
  "difficulty": 1|2|3|4|5,
  "bloomLevel": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create"
}
The correctAnswer for an MCQ must be identical to the option text at correctIndex.
Only output the JSON object.`;

export async function generateWithLLM(
  input: GenerationInput,
): Promise<GenerationOutput[]> {
  const key = process.env.LLM_KEY;
  if (!key) {
    throw new Error("LLM_KEY is not configured on the server");
  }
  const endpoint = process.env.LLM_ENDPOINT ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const userPrompt = [
    `Curriculum: ${input.curriculum}`,
    `Subject: ${input.subjectId}`,
    `Chapter: ${input.chapterId}`,
    `Sub-topic: ${input.subtopicId}`,
    `Bloom's level: ${input.bloomLevel}`,
    `Question type: ${input.questionType}`,
    `Difficulty (1-5): ${input.difficulty}`,
    `Command-word style: ${input.commandWordStyle}`,
    `Count: ${input.count ?? 1}`,
    "Generate the requested count of items now.",
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`LLM request failed with status ${res.status}`);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as { items?: unknown };
    if (!Array.isArray(parsed.items)) {
      throw new Error("LLM response did not contain an items array");
    }

    const items = parsed.items as GenerationOutput[];
    const valid = items
      .map((g) => ({ g, v: validateGenerationOutput(g) }))
      .filter((x) => x.v.ok)
      .map((x) => x.g)
      .slice(0, input.count ?? items.length);

    if (valid.length === 0) {
      throw new Error("LLM generated zero valid items");
    }
    return valid;
  } finally {
    clearTimeout(timer);
  }
}