import type {
  GenerationInput,
  GenerationOutput,
  QuestionType,
} from "@/lib/types";
import { SYNTHETIC_PROVENANCE } from "@/lib/data/provenance";
import { findSubtopic } from "@/lib/data/curricula";
import { hashString, seededRandom } from "@/lib/utils";

type Rng = () => number;

export function createGenerateInput(
  partial: Partial<GenerationInput> & {
    curriculum: GenerationInput["curriculum"];
    subjectId: string;
    chapterId: string;
    subtopicId: string;
  },
): GenerationInput {
  return {
    bloomLevel: partial.bloomLevel ?? "Apply",
    questionType: partial.questionType ?? "MCQ",
    difficulty: partial.difficulty ?? 3,
    commandWordStyle: partial.commandWordStyle ?? "Examine",
    count: partial.count ?? 1,
    ...partial,
  };
}

function intBetween(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ---------------------------------------------------------------------------
// Subject-specific template generators. Each returns a fully-specified,
// schema-validated, wholly-original item grounded in the topic metadata.
// ---------------------------------------------------------------------------

function genQuadratic(rng: Rng, style: string): GenerationOutput {
  const a = intBetween(rng, 2, 9);
  const b = intBetween(rng, 2, 9);
  const roots = [a, b];
  const sum = a + b;
  const product = a * b;
  const stemBase = `The quadratic equation x² − ${sum}x + ${product} = 0 has the roots:`;
  const stems = [
    `${stemBase} (choose the correct pair)`,
    `Find the two roots of x² − ${sum}x + ${product} = 0 by factorisation.`,
    `Which pair of numbers satisfies x² − ${sum}x + ${product} = 0?`,
  ][style.length % 3];
  const wrong1 = [a + 1, b - 1];
  const wrong2 = [a + 2, b];
  const wrong3 = [-a, -b];
  const fmt = (p: number[]) => p.join(" and ");
  return {
    stem: stems,
    options: [fmt(roots), fmt(wrong1), fmt(wrong2), fmt(wrong3).replace("-", "")],
    correctIndex: 0,
    correctAnswer: fmt(roots),
    distractorRationale: [
      `${fmt(wrong1)} does not satisfy the product (${wrong1[0] * wrong1[1]} ≠ ${product}).`,
      `${fmt(wrong2)} fails the sum condition (${wrong2[0] + wrong2[1]} ≠ ${sum}).`,
      `${fmt(wrong3)} are the roots of x² + ${sum}x + ${product} = 0, not of the given equation.`,
    ],
    stepByStepExplanation: `Find factor pairs of the constant ${product} that add to ${sum}: they are ${a} and ${b}, since ${a} + ${b} = ${sum} and ${a} × ${b} = ${product}. Hence (x − ${a})(x − ${b}) = 0, so the roots are ${fmt(roots)}.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 2,
    bloomLevel: "Apply",
  };
}

function genLinearEquation(rng: Rng, style: string): GenerationOutput {
  const a = intBetween(rng, 1, 9);
  const b = intBetween(rng, 1, 9);
  const c = intBetween(rng, 1, 9);
  const x = Math.round(((c - b) / a) * 100) / 100;
  const stem =
    style.length % 2 === 0
      ? `Solve for x: ${a}x + ${b} = ${c}.`
      : `What value of x satisfies the equation ${a}x + ${b} = ${c}?`;
  const distractor = (d: number) => Math.round((d + (rng() > 0.5 ? 1 : -1) * intBetween(rng, 1, 2)) * 100) / 100;
  const d1 = distractor(x);
  const d2 = distractor(x);
  const d3 = c % a === 0 ? c : b;
  return {
    stem,
    options: [String(x), String(d1), String(d2), String(d3)],
    correctIndex: 0,
    correctAnswer: String(x),
    distractorRationale: [
      `${d1} arises if the signs are reversed when isolating x.`,
      `${d2} is obtained when ${b} is added instead of subtracted (an inverse-operation slip).`,
      `${d3} confuses the constant ${c} with the solution value.`,
    ],
    stepByStepExplanation: `Subtract ${b} from both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${x}.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 1,
    bloomLevel: "Apply",
  };
}

function genApNthTerm(rng: Rng): GenerationOutput {
  const a1 = intBetween(rng, 1, 6);
  const d = intBetween(rng, 2, 5);
  const n = intBetween(rng, 8, 15);
  const tn = a1 + (n - 1) * d;
  const stem = `An arithmetic progression has first term ${a1} and common difference ${d}. The value of its ${ordinal(n)} term is:`;
  const near = (k: number) => a1 + (n - 2 + k) * d;
  const options = [String(tn), String(near(-1)), String(near(1)), String(a1 + n * d)];
  const shuffled = options
    .map((v, i) => ({ v, i }))
    .sort(() => rng() - 0.5);
  const correctShuffledIndex = shuffled.findIndex((s) => s.v === String(tn));
  return {
    stem,
    options: shuffled.map((s) => s.v),
    correctIndex: correctShuffledIndex,
    correctAnswer: String(tn),
    distractorRationale: [
      `${near(-1)} is the (${n}−1)th term — one step behind.`,
      `${near(1)} is the (${n}+1)th term, one step ahead.`,
      `${a1 + n * d} results from using n instead of (n−1) in the formula.`,
    ],
    stepByStepExplanation: `Using Tₙ = a + (n−1)d with a = ${a1}, d = ${d}, n = ${n}: Tₙ = ${a1} + (${n}−1)(${d}) = ${a1} + ${(n - 1) * d} = ${tn}.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 2,
    bloomLevel: "Apply",
  };
}

function genKinematics(rng: Rng, style: string): GenerationOutput {
  const u = intBetween(rng, 2, 10);
  const a = intBetween(rng, 2, 5);
  const t = intBetween(rng, 3, 8);
  const v = u + a * t;
  const question =
    style.length % 2 === 0
      ? `An object moves with initial velocity ${u} m/s and uniform acceleration ${a} m/s². Its velocity after ${t} seconds is:`
      : `Starting at ${u} m/s and accelerating at ${a} m/s², the object's speed after ${t} s is:`;
  const wrong = [u + a * (t - 1), u - a * t > 0 ? u - a * t : u + a * (t + 1), u * t + a * t];
  return {
    stem: question,
    options: [String(v), String(wrong[0]), String(wrong[1]), String(wrong[2])],
    correctIndex: 0,
    correctAnswer: String(v),
    distractorRationale: [
      `${wrong[0]} computes the velocity one second early.`,
      `${wrong[1]} applies the wrong operation (subtraction or an extra second).`,
      `${wrong[2]} multiplies velocity by time instead of adding the acceleration term.`,
    ],
    stepByStepExplanation: `By the first equation of motion v = u + at: v = ${u} + ${a}(${t}) = ${u} + ${a * t} = ${v} m/s.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 2,
    bloomLevel: "Apply",
  };
}

function genSeriesResistance(rng: Rng): GenerationOutput {
  const r1 = intBetween(rng, 2, 8);
  const r2 = intBetween(rng, 2, 8);
  const r3 = intBetween(rng, 2, 8);
  const tot = r1 + r2 + r3;
  const stem = `Three resistors of ${r1} Ω, ${r2} Ω and ${r3} Ω are connected in series. The total resistance of the combination is:`;
  const wrongs = [tot - r3, Math.round(tot / 3), r1 * r2 * r3];
  const options = [String(tot), String(wrongs[0]), String(wrongs[1]), String(wrongs[2])];
  const shuffled = options
    .map((v, i) => ({ v, i }))
    .sort(() => rng() - 0.5);
  return {
    stem,
    options: shuffled.map((s) => s.v),
    correctIndex: shuffled.findIndex((s) => s.v === String(tot)),
    correctAnswer: String(tot),
    distractorRationale: [
      `${wrongs[0]} drops one of the resistors from the sum.`,
      `${wrongs[1]} averages the resistances, which only arises in equal parallel splits.`,
      `${wrongs[2]} multiplies the values — reserved for series of capacitors, not resistors.`,
    ],
    stepByStepExplanation: `In series, resistances add directly: R = ${r1} + ${r2} + ${r3} = ${tot} Ω.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 2,
    bloomLevel: "Apply",
  };
}

function genProbabilityDie(rng: Rng, style: string): GenerationOutput {
  const outcome =
    style.length % 2 === 0
      ? "a number greater than 4"
      : "a multiple of 3";
  const stem = `A fair die is rolled once. The probability of rolling ${outcome} is:`;
  const wrongs = ["1/6", "1/2", "2/5"];
  return {
    stem,
    options: ["1/3", ...wrongs],
    correctIndex: 0,
    correctAnswer: "1/3",
    distractorRationale: [
      "1/6 is the probability of a single specific face.",
      "1/2 would require three favourable faces for the given condition.",
      "2/5 confuses outcomes with a non-uniform sample space.",
    ],
    stepByStepExplanation: `Favourable outcomes: for "${outcome}", that is 2 faces out of 6, so P = 2/6 = 1/3.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 1,
    bloomLevel: "Understand",
  };
}

function genLoopTrace(rng: Rng): GenerationOutput {
  const n = intBetween(rng, 4, 7);
  const step = intBetween(rng, 2, 3);
  let total = 0;
  const terms: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (i % step === 0) {
      total += i;
      terms.push(i);
    }
  }
  const stem = `What final value is printed by the loop?\nsum = 0\nfor i in range(1, ${n + 1}):\n    if i % ${step} == 0:\n        sum += i\nprint(sum)`;
  const wrongs = [
    total + step,
    Math.max(1, total - 1),
    Math.floor((n * (n + 1)) / 2),
  ];
  const options = [String(total), ...wrongs.map(String)];
  const shuffled = options
    .map((v, i) => ({ v, i }))
    .sort(() => rng() - 0.5);
  return {
    stem,
    options: shuffled.map((s) => s.v),
    correctIndex: shuffled.findIndex((s) => s.v === String(total)),
    correctAnswer: String(total),
    distractorRationale: [
      `${total + step} includes the next multiple of ${step} beyond the loop range.`,
      `${Math.max(1, total - 1)} misses one of the qualifying terms.`,
      `${Math.floor((n * (n + 1)) / 2)} is the sum of every number 1..${n}, not just multiples of ${step}.`,
    ],
    stepByStepExplanation: `The loop accumulates numbers from 1 to ${n} that are divisible by ${step}: ${terms.join(", ")}, which sum to ${total}.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 2,
    bloomLevel: "Analyze",
  };
}

function genEquilibrium(rng: Rng): GenerationOutput {
  const intercept = intBetween(rng, 60, 120);
  const slope = intBetween(rng, 2, 3);
  const supplySlope = intBetween(rng, slope + 1, 4);
  const pEq = Math.round((intercept / (slope + supplySlope)) * 100) / 100;
  const stem = `Demand is Qd = ${intercept} − ${slope}P and supply is Qs = ${supplySlope}P. The market-clearing price is:`;
  const wrongs = [
    Math.round((pEq + 6) * 100) / 100,
    Math.round((pEq - 4) * 100) / 100,
    intercept,
  ];
  const options = [String(pEq), ...wrongs.map(String)];
  const shuffled = options
    .map((v, i) => ({ v, i }))
    .sort(() => rng() - 0.5);
  return {
    stem,
    options: shuffled.map((s) => s.v),
    correctIndex: shuffled.findIndex((s) => s.v === String(pEq)),
    correctAnswer: String(pEq),
    distractorRationale: [
      `${wrongs[0]} overstates the clearing price.`,
      `${wrongs[1]} rounds or truncates the equilibrium incorrectly.`,
      `${wrongs[2]} is the demand intercept, not the equilibrium price.`,
    ],
    stepByStepExplanation: `Set quantity demanded equal to quantity supplied: ${intercept} − ${slope}P = ${supplySlope}P → ${intercept} = ${slope + supplySlope}P → P = ${pEq}.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: 2,
    bloomLevel: "Apply",
  };
}

// ---------------------------------------------------------------------------
// Generic fallback: builds a recall/understanding item from the subtopic's
// learning objectives. Produces original phrasing anchored on the objective.
// ---------------------------------------------------------------------------

const BLOOM_VERBS: Record<GenerationInput["bloomLevel"], string> = {
  Remember: "recognise",
  Understand: "characterise",
  Apply: "apply",
  Analyze: "distinguish",
  Evaluate: "critically evaluate",
  Create: "construct",
};

function genericGenerate(
  subtopicId: string,
  input: GenerationInput,
  rng: Rng,
): GenerationOutput {
  const node = findSubtopic(subtopicId);
  const lo = node?.subtopic.learningObjectives[0] ?? "master the core ideas of this topic";
  const topicName = node?.subtopic.name ?? "the topic";
  const tags = node?.subtopic.tags ?? [];
  const verb = BLOOM_VERBS[input.bloomLevel];
  const stem = `Which statement most accurately describes what it means to ${verb} "${topicName}"?`;
  const optionSet = [
    `To ${verb} "${topicName}" means to be able to ${lo}.`,
    `To ${verb} "${topicName}" means to memorise related terms without connecting them to concepts.`,
    `To ${verb} "${topicName}" means to master unrelated topics in the same syllabus.`,
    `To ${verb} "${topicName}" is possible only through rote repetition of answers.`,
  ];
  const shuffled = optionSet
    .map((v, i) => ({ v, i }))
    .sort(() => rng() - 0.5);
  return {
    stem,
    options: shuffled.map((s) => s.v),
    correctIndex: shuffled.findIndex((s) => s.v === optionSet[0]),
    correctAnswer: optionSet[0],
    distractorRationale: [
      "Memorisation alone does not satisfy a comprehension-level objective.",
      "Covering unrelated topics does not demonstrate mastery of this one.",
      "Rote repetition is not how this outcome is assessed.",
    ],
    stepByStepExplanation: `The learning objective for this sub-topic is: ${lo}. A correct response targets exactly that objective. Related tags: ${tags.join(", ") || "none"}.`,
    sourceType: "synthetic",
    provenance: SYNTHETIC_PROVENANCE,
    difficulty: input.difficulty,
    bloomLevel: input.bloomLevel,
  };
}

// ---------------------------------------------------------------------------

const SUBTOPIC_GENERATORS: Record<string, (rng: Rng, style: string) => GenerationOutput> = {
  "mat-he-quad": genQuadratic,
  "sat-math-alg-linear": genLinearEquation,
  "mat-he-arith": genApNthTerm,
  "phy-mech-kin": genKinematics,
  "jee-mech-kin": genKinematics,
  "neet-mech-kin": genKinematics,
  "phy-elec-ohm": genSeriesResistance,
  "jee-elm-cur": genSeriesResistance,
  "mat-cal-prob": genProbabilityDie,
  "univ-prog-jargon": genLoopTrace,
  "univ-econ-supply": genEquilibrium,
};

const TYPE_REMAP: Partial<Record<QuestionType, QuestionType>> = {
  Short: "MCQ",
  Long: "MCQ",
  AssertionReason: "MCQ",
};

export function generateSynthetic(input: GenerationInput): GenerationOutput[] {
  const count = Math.min(Math.max(input.count ?? 1, 1), 20);
  const rng = seededRandom(hashString(`${input.subtopicId}|${input.bloomLevel}|${input.difficulty}`));
  const out: GenerationOutput[] = [];
  for (let i = 0; i < count; i++) {
    rng();
    const factory = SUBTOPIC_GENERATORS[input.subtopicId];
    const type = TYPE_REMAP[input.questionType] ?? input.questionType;
    if (type !== "MCQ" || !factory) {
      out.push(genericGenerate(input.subtopicId, input, rng));
      continue;
    }
    const g = factory(rng, input.commandWordStyle);
    out.push({
      ...g,
      difficulty: input.difficulty,
      bloomLevel: input.bloomLevel,
    });
  }
  return out;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function generationOutputToQuestion(
  input: GenerationInput,
  output: GenerationOutput,
  index: number,
): import("@/lib/types").Question {
  void index;
  return {
    id: `gen_${input.subtopicId}_${input.difficulty}_${input.bloomLevel}_${Math.floor(Math.random() * 1e6)}`,
    curriculum: input.curriculum,
    subjectId: input.subjectId,
    chapterId: input.chapterId,
    subtopicId: input.subtopicId,
    type: input.questionType === "Numerical" ? "Numerical" : "MCQ",
    stem: output.stem,
    options: output.options,
    correctIndex: output.correctIndex,
    correctAnswer: output.correctAnswer,
    distractorRationale: output.distractorRationale,
    stepByStepExplanation: output.stepByStepExplanation,
    difficulty: output.difficulty,
    bloomLevel: output.bloomLevel,
    commandWordStyle: input.commandWordStyle,
    sourceType: "synthetic",
    provenance: output.provenance,
    tags: [],
    marks: 1,
  };
}