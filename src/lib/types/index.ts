export type CurriculumCode = "CBSE" | "ICSE" | "JEE" | "NEET" | "SAT" | "UNIVERSITY";

export type QuestionType =
  | "MCQ"
  | "AssertionReason"
  | "Numerical"
  | "Short"
  | "Long";

export type BloomLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create";

export type SourceLane = "synthetic" | "public-domain";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Provenance {
  source: string;
  citation: string;
  license: string;
  permittedUse: string;
  retrievedAt?: string;
  reviewedAt: string;
  status: "verified-public" | "generated-in-house";
}

export interface ExamSectionMeta {
  id: string;
  name: string;
  minutes: number;
  questionCount: number;
}

export interface ExamMeta {
  sections: ExamSectionMeta[];
  totalMinutes: number;
  structure: string;
}

export interface SubTopic {
  id: string;
  name: string;
  learningObjectives: string[];
  bloomLevels: BloomLevel[];
  difficultyBand: [Difficulty, Difficulty];
  tags: string[];
  availableCount: number;
}

export interface Chapter {
  id: string;
  name: string;
  subtopics: SubTopic[];
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface Curriculum {
  code: CurriculumCode;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  examMeta: ExamMeta;
  subjects: Subject[];
}

export interface Question {
  id: string;
  curriculum: CurriculumCode;
  subjectId: string;
  chapterId: string;
  subtopicId: string;
  type: QuestionType;
  stem: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer: string;
  distractorRationale: string[];
  stepByStepExplanation: string;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
  commandWordStyle: string;
  sourceType: SourceLane;
  provenance?: Provenance;
  tags: string[];
  marks: number;
}

export interface NodeSelection {
  curriculum: CurriculumCode;
  subjectId?: string;
  chapterIds: string[];
  subtopicIds: string[];
}

export type DifficultyMix = Record<Difficulty, number>;

export interface TestConfig {
  id: string;
  title: string;
  selection: NodeSelection;
  questionCount: number;
  questionTypes: QuestionType[];
  difficultyMix: DifficultyMix;
  timed: boolean;
  totalMinutes: number;
  sourceLane: SourceLane | "mixed";
  mockExam: boolean;
  adaptive: boolean;
  createdAt: number;
}

export interface SessionQuestion {
  question: Question;
  userAnswer?: string;
  userAnswerIndex?: number;
  flagged: boolean;
  timeSpentSec: number;
  correct?: boolean;
  scoredMarks: number;
}

export interface ExamSession {
  id: string;
  config: TestConfig;
  questions: SessionQuestion[];
  startedAt: number;
  submittedAt?: number;
  autoSubmitted?: boolean;
  remainingMs: number;
  activeSectionIndex: number;
  status: "active" | "submitted";
}

export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  attempted: number;
  correct: number;
  total: number;
  marks: number;
  accuracy: number;
}

export interface TopicMastery {
  subtopicId: string;
  subtopicName: string;
  subjectId: string;
  curriculum: CurriculumCode;
  attempts: number;
  correct: number;
  accuracy: number;
  avgDifficulty: Difficulty;
}

export interface ReadinessEstimate {
  band: string;
  percentile: number;
  confidence: "low" | "medium" | "high";
  trend: "improving" | "steady" | "declining";
  perSubject: Array<{ subjectId: string; subjectName: string; band: string; percentile: number }>;
}

export interface AttemptSummary {
  id: string;
  configTitle: string;
  curriculum: CurriculumCode;
  completedAt: number;
  totalQuestions: number;
  answered: number;
  correct: number;
  totalMarks: number;
  scoredMarks: number;
  accuracy: number;
  timeTakenSec: number;
  timed: boolean;
  breakdown: SubjectScore[];
  mastery: TopicMastery[];
  weakSpots: string[];
}

export interface StudyPlanSuggestion {
  id: string;
  subtopicId: string;
  subtopicName: string;
  subjectId: string;
  reason: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface Profile {
  attempts: AttemptSummary[];
  mastery: TopicMastery[];
  streaks: {
    current: number;
    best: number;
    lastActivityDay: string;
  };
  studyPlan: StudyPlanSuggestion[];
}

export interface GenerationInput {
  curriculum: CurriculumCode;
  subjectId: string;
  chapterId: string;
  subtopicId: string;
  bloomLevel: BloomLevel;
  questionType: QuestionType;
  difficulty: Difficulty;
  commandWordStyle: string;
  count?: number;
}

export interface GenerationOutput {
  stem: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer: string;
  distractorRationale: string[];
  stepByStepExplanation: string;
  sourceType: "synthetic";
  provenance: Provenance;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
}

export interface TutorRequest {
  questionId: string;
  intent:
    | "why-wrong"
    | "explain-differently"
    | "similar-easier"
    | "concept-deep-dive"
    | "freeform";
  prompt?: string;
  userAnswerIndex?: number;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}
