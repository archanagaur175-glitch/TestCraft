import type { AttemptSummary, Profile, ReadinessEstimate, TopicMastery } from "@/lib/types";
import { subjectName } from "@/lib/data/lookup";
import { clamp, round } from "@/lib/utils";

export function bandForPercentile(p: number): string {
  if (p >= 95) return "Elite";
  if (p >= 80) return "Exam-Ready";
  if (p >= 60) return "Proficient";
  if (p >= 40) return "Developing";
  if (p >= 20) return "Emerging";
  return "Foundation";
}

export function estimateTrend(attempts: AttemptSummary[]): ReadinessEstimate["trend"] {
  if (attempts.length < 3) return "steady";
  const recent = attempts.slice(-4).map((a) => a.accuracy);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  if (diff > 6) return "improving";
  if (diff < -6) return "declining";
  return "steady";
}

export function estimateReadiness(profile: Profile): ReadinessEstimate {
  const attempts = profile.attempts;
  const mastery = profile.mastery;

  let weightedAccuracy = 0;
  let accuracySum = 0;
  for (const m of mastery) {
    if (m.attempts === 0) continue;
    weightedAccuracy += m.accuracy * m.avgDifficulty;
    accuracySum += m.avgDifficulty;
  }
  const difficultyAware = accuracySum > 0 ? weightedAccuracy / accuracySum : 0;

  const rawAccuracy = attempts.length
    ? attempts.reduce((a, t) => a + t.accuracy, 0) / attempts.length
    : 0;

  const experienceBonus = clamp(attempts.length * 1.5, 0, 8);
  const difficultyPremium = difficultyAware >= 65 ? 6 : difficultyAware >= 45 ? 2 : -4;
  let percentile = round(
    clamp(rawAccuracy * 0.62 + difficultyAware * 0.28 + experienceBonus + difficultyPremium, 4, 99),
  );

  if (attempts.length === 0) percentile = 4;
  else if (!attempts.some((a) => a.answered > 0)) percentile = 4;

  const perSubject: ReadinessEstimate["perSubject"] = [];
  const bySubject = new Map<string, TopicMastery[]>();
  for (const m of mastery) bySubject.set(m.subjectId, [...(bySubject.get(m.subjectId) ?? []), m]);
  for (const [sid, ms] of bySubject.entries()) {
    const subjAccuracy =
      ms.reduce((a, m) => a + m.accuracy, 0) / ms.filter((m) => m.attempts > 0).length || 0;
    const subjPct = clamp(Math.round(subjAccuracy * 0.75 + experienceBonus), 4, 99);
    perSubject.push({
      subjectId: sid,
      subjectName: subjectName(attempts[0]?.curriculum ?? "CBSE", sid),
      band: bandForPercentile(subjPct),
      percentile: subjPct,
    });
  }

  const confidence: ReadinessEstimate["confidence"] =
    attempts.length >= 6 ? "high" : attempts.length >= 3 ? "medium" : "low";

  return {
    band: bandForPercentile(percentile),
    percentile,
    confidence,
    trend: estimateTrend(attempts),
    perSubject,
  };
}

export function readinessGoalHint(estimate: ReadinessEstimate): string {
  const next = estimate.percentile >= 40 ? estimate.percentile + 5 : 40;
  return `Next target: ${bandForPercentile(next)} band (~${next}%).`;
}