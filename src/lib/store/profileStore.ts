"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AttemptSummary,
  Difficulty,
  Profile,
  StudyPlanSuggestion,
  TopicMastery,
} from "@/lib/types";
import { subtopicName } from "@/lib/data/lookup";
import { todayKey, uid } from "@/lib/utils";

const EMPTY_PROFILE: Profile = {
  attempts: [],
  mastery: [],
  streaks: { current: 0, best: 0, lastActivityDay: "" },
  studyPlan: [],
};

const DAY_MS = 24 * 60 * 60 * 1000;

function mergeMastery(existing: TopicMastery[], incoming: TopicMastery[]): TopicMastery[] {
  const map = new Map(existing.map((m) => [m.subtopicId, { ...m }]));
  for (const inc of incoming) {
    const cur = map.get(inc.subtopicId);
    if (!cur) {
      map.set(inc.subtopicId, { ...inc });
      continue;
    }
    const newAttempts = cur.attempts + inc.attempts;
    cur.correct += inc.correct;
    cur.attempts = newAttempts;
    cur.accuracy = Math.round((cur.correct / newAttempts) * 1000) / 10;
    cur.avgDifficulty = Math.round(
      (cur.avgDifficulty * (newAttempts - inc.attempts) + inc.avgDifficulty * inc.attempts) /
        newAttempts,
    ) as Difficulty;
  }
  return Array.from(map.values());
}

function nextStreak(prev: Profile["streaks"]): Profile["streaks"] {
  const today = todayKey();
  if (prev.lastActivityDay === today) return prev;
  const last = prev.lastActivityDay ? new Date(prev.lastActivityDay + "T00:00:00") : null;
  const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
  const current = last && new Date(last.getTime() + DAY_MS) >= new Date(yesterday + "T00:00:00")
    ? prev.current + 1
    : 1;
  return {
    current,
    best: Math.max(prev.best, current),
    lastActivityDay: today,
  };
}

function buildStudyPlan(summary: AttemptSummary, mastery: TopicMastery[]): StudyPlanSuggestion[] {
  const suggestions: StudyPlanSuggestion[] = [];
  const fromWeak = summary.weakSpots.slice(0, 3);
  for (const id of fromWeak) {
    suggestions.push({
      id: uid("plan"),
      subtopicId: id,
      subtopicName: subtopicName(id),
      subjectId: summary.breakdown.find((b) => b.subjectId)?.subjectId ?? "",
      reason: "Lower-than-target accuracy on this sub-topic",
      action: "Complete a 5-question foundational drill, then revisit the explanations.",
      priority: "high",
    });
  }
  const lowAttempts = mastery
    .filter((m) => m.attempts < 2 && !fromWeak.includes(m.subtopicId))
    .slice(0, 2);
  for (const m of lowAttempts) {
    suggestions.push({
      id: uid("plan"),
      subtopicId: m.subtopicId,
      subtopicName: subtopicName(m.subtopicId),
      subjectId: m.subjectId,
      reason: "Sub-topic not yet practised enough to be reliably assessed",
      action: "Take one short practice set to baseline this area.",
      priority: "medium",
    });
  }
  return suggestions.slice(0, 5);
}

interface ProfileState {
  profile: Profile;
  recordAttempt: (summary: AttemptSummary, mastery: TopicMastery[]) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: EMPTY_PROFILE,
      recordAttempt(summary, mastery) {
        set((s) => {
          const attempts = [summary, ...s.profile.attempts].slice(0, 60);
          const merged = mergeMastery(s.profile.mastery, mastery.length ? mastery : summary.mastery);
          const plan = buildStudyPlan(summary, merged);
          return {
            profile: {
              attempts,
              mastery: merged,
              streaks: nextStreak(s.profile.streaks),
              studyPlan: plan,
            },
          };
        });
      },
      resetProfile() {
        set({ profile: EMPTY_PROFILE });
      },
    }),
    {
      name: "testcraft-profile",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);