import type {
  AttemptSummary,
  CurriculumCode,
  Difficulty,
  ExamSession,
  SubjectScore,
  TopicMastery,
} from "@/lib/types";
import { subjectName } from "@/lib/data/lookup";
import { pct } from "@/lib/utils";

export function isAnswerCorrect(
  correctIndex: number | undefined,
  userAnswerIndex: number | undefined,
  correctAnswer: string,
  userAnswer: string | undefined,
): boolean {
  if (userAnswerIndex != null && correctIndex != null) {
    return userAnswerIndex === correctIndex;
  }
  if (userAnswer != null && (correctAnswer ?? "").trim().length > 0) {
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }
  return false;
}

export function gradeSession(session: ExamSession): ExamSession {
  const graded = session.questions.map((sq) => {
    if (sq.scoredMarks > 0 || sq.correct === false) return sq;
    const correct = isAnswerCorrect(
      sq.question.correctIndex,
      sq.userAnswerIndex,
      sq.question.correctAnswer,
      sq.userAnswer,
    );
    return {
      ...sq,
      correct,
      scoredMarks: correct ? sq.question.marks : 0,
    };
  });
  return { ...session, questions: graded };
}

export function buildAttemptSummary(
  session: ExamSession,
  curriculum: CurriculumCode,
): AttemptSummary {
  const gradedQuestions = session.questions.map((sq) => ({
    ...sq,
    correct: isAnswerCorrect(
      sq.question.correctIndex,
      sq.userAnswerIndex,
      sq.question.correctAnswer,
      sq.userAnswer,
    ),
    scoredMarks: isAnswerCorrect(
      sq.question.correctIndex,
      sq.userAnswerIndex,
      sq.question.correctAnswer,
      sq.userAnswer,
    )
      ? sq.question.marks
      : 0,
  }));

  const answered = gradedQuestions.filter(
    (sq) => sq.userAnswerIndex != null || (sq.userAnswer != null && sq.userAnswer.trim() !== ""),
  );
  const totalMarks = gradedQuestions.reduce((a, q) => a + q.question.marks, 0);
  const scoredMarks = gradedQuestions.reduce((a, q) => a + q.scoredMarks, 0);

  const bySubject = new Map<string, SubjectScore>();
  for (const sq of gradedQuestions) {
    const { subjectId, curriculum: cur } = sq.question;
    const entry =
      bySubject.get(subjectId) ??
      ({
        subjectId,
        subjectName: subjectName(cur, subjectId),
        attempted: 0,
        correct: 0,
        total: 0,
        marks: 0,
        accuracy: 0,
      } as SubjectScore);
    entry.total += 1;
    entry.attempted +=
      sq.userAnswerIndex != null || (sq.userAnswer != null && sq.userAnswer.trim() !== "")
        ? 1
        : 0;
    entry.correct += sq.correct ? 1 : 0;
    entry.marks += sq.scoredMarks;
    entry.accuracy = pct(entry.correct, entry.attempted);
    bySubject.set(subjectId, entry);
  }

  const bySubtopic = new Map<string, TopicMastery>();
  for (const sq of gradedQuestions) {
    const { subtopicId, subjectId, curriculum: cur, difficulty } = sq.question;
    const entry =
      bySubtopic.get(subtopicId) ??
      ({
        subtopicId,
        subtopicName: subtopicId,
        subjectId,
        curriculum: cur,
        attempts: 0,
        correct: 0,
        accuracy: 0,
        avgDifficulty: difficulty,
      } as TopicMastery);
    entry.attempts += 1;
    entry.correct += sq.correct ? 1 : 0;
    entry.accuracy = pct(entry.correct, entry.attempts);
    entry.avgDifficulty = Math.round(
      (entry.avgDifficulty * (entry.attempts - 1) + difficulty) / entry.attempts,
    ) as Difficulty;
    bySubtopic.set(subtopicId, entry);
  }

  const mastery = Array.from(bySubtopic.values());
  const weakSpots = mastery
    .filter((m) => m.accuracy < 60 && m.attempts >= 1)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 6)
    .map((m) => m.subtopicId);

  return {
    id: session.id,
    configTitle: session.config.title,
    curriculum,
    completedAt: session.submittedAt ?? Date.now(),
    totalQuestions: gradedQuestions.length,
    answered: answered.length,
    correct: gradedQuestions.filter((q) => q.correct).length,
    totalMarks,
    scoredMarks,
    accuracy: pct(gradedQuestions.filter((q) => q.correct).length, gradedQuestions.length),
    timeTakenSec: Math.round(
      ((session.submittedAt ?? Date.now()) - session.startedAt) / 1000,
    ),
    timed: session.config.timed,
    breakdown: Array.from(bySubject.values()),
    mastery,
    weakSpots,
  };
}