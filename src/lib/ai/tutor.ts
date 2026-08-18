import type { Question, TutorRequest } from "@/lib/types";
import { subtopicName } from "@/lib/data/lookup";

export function tutorContextFor(question: Question, userAnswerIndex?: number) {
  const chosenOption =
    question.options && userAnswerIndex != null ? question.options[userAnswerIndex] : undefined;
  let distractorExplanation: string | undefined;
  if (question.options && userAnswerIndex != null && userAnswerIndex !== question.correctIndex) {
    const idx = Array.from(question.options.keys()).filter((i) => i !== question.correctIndex).indexOf(userAnswerIndex);
    if (idx >= 0) distractorExplanation = question.distractorRationale[idx];
  }
  return { chosenOption, distractorExplanation };
}

export function deterministicTutorResponse(
  question: Question,
  request: TutorRequest,
): string {
  const { chosenOption, distractorExplanation } = tutorContextFor(question, request.userAnswerIndex);
  const topic = subtopicName(question.subtopicId);

  const explain = `## Why this question works the way it does

Topic: **${topic}** · Bloom's level: *${question.bloomLevel}* · Difficulty: ${question.difficulty}/5

${question.stepByStepExplanation}

${
  question.distractorRationale.length
    ? `**Common pitfalls:**
${question.distractorRationale.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
    : ""
}`;

  switch (request.intent) {
    case "why-wrong":
      return `## Let's fix the mistake

${
  chosenOption
    ? `You selected: **"${chosenOption}"**.`
    : "You left this question unanswered."
}

${
  distractorExplanation
    ? `That choice is a classic trap: **${distractorExplanation}**

The key insight is to always ___${question.commandWordStyle.toLowerCase()}___ systematically before committing.`
    : "Let's rebuild the reasoning from the ground up."
}

${explain}`;

    case "explain-differently":
      return `## A simpler way to see it

${question.stepByStepExplanation}

**Intuition check:** ask yourself which *single concept* this problem tests — for **${topic}** it is almost always one core relationship. Once you name it, the numbers become decoration.

Try this: restate the question in your own words, then compare your restatement with the explanation above. Any gap you find is the skill to drill next.`;

    case "similar-easier": {
      const easier = Math.max(1, question.difficulty - 1);
      return `## Practice one step easier

This question is difficulty **${question.difficulty}/5**. Try the same objective at **${easier}/5** to lock in the foundation:

- Re-read the explanation above and write the first step *before* reading the second.
- Then come back to this difficulty and attempt it again.
- Related sub-topic to review: **${topic}**.

When you're consistently scoring that easier band, request difficulty ${question.difficulty + 1 <= 5 ? `**${question.difficulty + 1}/5**` : "5/5"} for a stretch.`;
    }

    case "concept-deep-dive":
      return `## Deeper concepts behind ${topic}

${explain}

**Extension questions to ask yourself:**
1. What changes if one of the given conditions is relaxed?
2. Which related skill (${question.tags.join(", ") || "adjacent topics"}) wraps around this one?
3. How would this concept appear in a ${question.curriculum}-style exam?`;

    default:
      return `## Getting the most from ${topic}

${explain}

Tip: for freeform questions, tell me which step felt unclear (the setup, the working, or the conclusion) and I'll zoom into exactly that.`;
  }
}