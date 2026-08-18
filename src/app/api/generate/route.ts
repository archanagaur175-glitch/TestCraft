import { NextRequest } from "next/server";
import type { GenerationInput, GenerationOutput } from "@/lib/types";
import { generateWithLLM } from "@/lib/generation/llmEngine";
import { generateSynthetic } from "@/lib/generation/templateEngine";
import { validateGenerationOutput } from "@/lib/generation/validator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

const usage = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = usage.get(key);
  if (!entry || entry.resetAt < now) {
    usage.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_PER_WINDOW - 1 };
  }
  entry.count += 1;
  return { ok: entry.count <= MAX_PER_WINDOW, remaining: MAX_PER_WINDOW - entry.count };
}

const ALLOWED_BLOOM = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const ALLOWED_TYPES = ["MCQ", "AssertionReason", "Numerical", "Short", "Long"];
const ALLOWED_CURRICULA = ["CBSE", "ICSE", "JEE", "NEET", "SAT", "UNIVERSITY"];

function sanitizeInput(body: unknown): GenerationInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.curriculum !== "string" || !ALLOWED_CURRICULA.includes(b.curriculum)) return null;
  if (typeof b.subjectId !== "string" || typeof b.chapterId !== "string") return null;
  if (typeof b.subtopicId !== "string") return null;
  const bloomLevel =
    typeof b.bloomLevel === "string" && ALLOWED_BLOOM.includes(b.bloomLevel)
      ? (b.bloomLevel as GenerationInput["bloomLevel"])
      : "Apply";
  const questionType =
    typeof b.questionType === "string" && ALLOWED_TYPES.includes(b.questionType)
      ? (b.questionType as GenerationInput["questionType"])
      : "MCQ";
  const difficulty =
    typeof b.difficulty === "number" && b.difficulty >= 1 && b.difficulty <= 5
      ? (b.difficulty as 1 | 2 | 3 | 4 | 5)
      : 3;
  const count =
    typeof b.count === "number" ? Math.min(Math.max(Math.floor(b.count), 1), 20) : 1;
  return {
    curriculum: b.curriculum as GenerationInput["curriculum"],
    subjectId: b.subjectId,
    chapterId: b.chapterId,
    subtopicId: b.subtopicId,
    bloomLevel,
    questionType,
    difficulty,
    commandWordStyle: typeof b.commandWordStyle === "string" ? b.commandWordStyle : "Examine",
    count,
  };
}

export async function POST(req: NextRequest) {
  const ip =
    (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`gen:${ip}`);
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = sanitizeInput(body);
  if (!input) {
    return Response.json({ error: "Invalid generation input schema" }, { status: 400 });
  }

  let items: GenerationOutput[] = [];
  let engine: "llm" | "template" = "template";

  if (process.env.LLM_KEY) {
    try {
      items = await generateWithLLM(input);
      engine = "llm";
    } catch {
      items = [];
    }
  }

  if (items.length === 0) {
    items = generateSynthetic(input).filter((g) => validateGenerationOutput(g).ok);
  }

  return Response.json({ items, engine, remaining: rl.remaining });
}