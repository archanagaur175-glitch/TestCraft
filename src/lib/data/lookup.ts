import { CURRICULUM_MAP } from "@/lib/data/curricula";
import type { CurriculumCode } from "@/lib/types";

export function subjectName(curriculumCode: CurriculumCode, subjectId: string): string {
  return (
    CURRICULUM_MAP[curriculumCode]?.subjects.find((s) => s.id === subjectId)?.name ??
    subjectId
  );
}

export function subtopicName(subtopicId: string): string {
  for (const c of Object.values(CURRICULUM_MAP)) {
    for (const s of c.subjects) {
      for (const chx of s.chapters) {
        const t = chx.subtopics.find((x) => x.id === subtopicId);
        if (t) return t.name;
      }
    }
  }
  return subtopicId;
}

export function curriculumName(code: CurriculumCode): string {
  return CURRICULUM_MAP[code]?.name ?? code;
}