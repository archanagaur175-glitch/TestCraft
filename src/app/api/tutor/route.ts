import { NextRequest } from "next/server";
import type { TutorRequest } from "@/lib/types";
import { findQuestion } from "@/lib/data/questions";
import { deterministicTutorResponse } from "@/lib/ai/tutor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LLM_PROMPT = (
  request: TutorRequest,
  questionText: { stem: string; options?: string[]; correctAnswer: string; explanation: string; distractorRationale: string[]; subtopic: string },
  userChoice?: string,
  userAnswerText?: string,
) => `You are TestCraft's per-question tutor. This is a FOCUSED tutoring session scoped to ONE question and its curriculum node.

QUESTION STEM:
${questionText.stem}
${questionText.options ? `OPTIONS:\n${questionText.options.map((o, i) => `${i}: ${o}`).join("\n")}` : ""}
CORRECT ANSWER: ${questionText.correctAnswer}
USER ${userChoice ? `SELECTED OPTION: ${userChoice}` : ""}${userAnswerText ? `\nUSER TYPED: ${userAnswerText}` : ""}

SUB-TOPIC: ${questionText.subtopic}
OFFICIAL STEP-BY-STEP EXPLANATION:
${questionText.explanation}
${questionText.distractorRationale.length ? `DISTRACTOR RATIONALES:\n${questionText.distractorRationale.join("\n")}` : ""}

INTENT: ${request.intent}
${request.prompt ? `STUDENT QUESTION: ${request.prompt}` : ""}
${request.history.length ? `CONVERSATION SO FAR:\n${request.history.map((h) => `${h.role.toUpperCase()}: ${h.content}`).join("\n")}` : ""}

Respond as a supportive, concise tutor. Use short paragraphs and minimal markdown (bold/italics only, no tables, no headings above level 3). Stay ON-TOPIC for this question. Never ask for payment or suggest off-topic content.`;

export async function POST(req: NextRequest) {
  let body: TutorRequest;
  try {
    body = (await req.json()) as TutorRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = findQuestion(body.questionId);
  if (!question) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  const topicLabel = question.subtopicId;

  if (!process.env.LLM_KEY) {
    return Response.json({
      content: deterministicTutorResponse(question, body),
      engine: "template",
    });
  }

  const userChoice =
    body.userAnswerIndex != null && question.options
      ? `${body.userAnswerIndex}: ${question.options[body.userAnswerIndex]}`
      : undefined;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(process.env.LLM_ENDPOINT ?? "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? "gpt-4o-mini",
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content:
                "You are a warm, precise one-on-one tutor. Answer in short, readable paragraphs.",
            },
            {
              role: "user",
              content: LLM_PROMPT(
                body,
                {
                  stem: question.stem,
                  options: question.options,
                  correctAnswer: question.correctAnswer,
                  explanation: question.stepByStepExplanation,
                  distractorRationale: question.distractorRationale,
                  subtopic: topicLabel,
                },
                userChoice,
                body.prompt,
              ),
            },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`LLM ${res.status}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty LLM response");
      return Response.json({ content, engine: "llm" });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return Response.json({
      content: deterministicTutorResponse(question, body),
      engine: "template",
    });
  }
}