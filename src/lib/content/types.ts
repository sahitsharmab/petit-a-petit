import type { Confusable } from "@/lib/french/evaluate";
import type { Subject, Tense } from "@/lib/french/conjugate";

export type CEFR = "A1" | "A2" | "B1";
export type SkillCategory = "grammar" | "vocabulary" | "listening" | "conversation" | "review";

export type ExerciseType =
  | "multiple_choice"
  | "fill_blank"
  | "sentence_builder"
  | "translation"
  | "transformation"
  | "conjugation"
  | "listening"
  | "dialogue";

export type LessonSection = "warmup" | "core" | "build" | "conversation";

export const EXERCISE_LABEL: Record<ExerciseType, string> = {
  multiple_choice: "Multiple choice",
  fill_blank: "Fill in the blank",
  sentence_builder: "Sentence builder",
  translation: "Translation",
  transformation: "Transformation",
  conjugation: "Conjugation",
  listening: "Listening",
  dialogue: "Conversation",
};

/** Text fields named `fr` hold the course language's text (French or German). */
export interface DialogueLine {
  who: "them" | "you";
  fr: string;
  en: string;
}

/** Full exercise as stored in the DB (server side, includes answers). */
export interface Exercise {
  id: string;
  type: ExerciseType;
  skillId: string;
  section: LessonSection;
  /** Spaced-repetition key, e.g. "conj:parler:present:nous" or "sent:w1-s3". */
  itemKey: string;
  instruction: string;
  prompt: string;
  promptNote?: string;
  hint: string;
  explanation: string;
  rule: string;
  accepted: string[];
  confusables?: Confusable[];
  /** English meaning of the answer / sentence. */
  translation?: string;
  /** French text read aloud by speech synthesis. */
  audioText?: string;
  options?: string[];
  answerIndex?: number;
  optionNotes?: string[];
  tiles?: string[];
  blank?: { before: string; after: string };
  lines?: DialogueLine[];
  /** For listening: "dictation" (type what you hear) or "choice". */
  mode?: "dictation" | "choice";
  /** Free-form answers that may be judged by AI when locally wrong. */
  allowAiJudge?: boolean;
  source: "local" | "ai";
  meta?: Record<string, string | number | boolean>;
  /** Tap-to-reveal word hints, added when a lesson is shown (never stored with the exercise). */
  glosses?: Gloss[];
}

/** A word hint: `span` is underlined in the prompt; tapping shows `meaning` (and `note`). */
export interface Gloss {
  /** Identifies the word for the learner's exposure count, e.g. "de:kind". */
  key: string;
  /** The exact text in the prompt to underline. */
  span: string;
  meaning: string;
  /** Dictionary form when it differs, e.g. "das Kind, die Kinder". */
  note?: string;
}

/** Exercise as sent to the browser (no answers). */
export type PublicExercise = Omit<Exercise, "accepted" | "confusables" | "answerIndex" | "explanation" | "optionNotes">;

export function toPublic(e: Exercise): PublicExercise {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accepted, confusables, answerIndex, explanation, optionNotes, ...rest } = e;
  return rest;
}

export interface ExplanationSection {
  heading: string;
  body: string;
  /** Short rules shown as a list instead of a paragraph: easier to scan than a dense body. */
  points?: RulePoint[];
  table?: { headers: string[]; rows: string[][] };
  examples?: { fr: string; en: string }[];
}

/** One rule: what it applies to, what to do, and a couple of forms in the course language. */
export interface RulePoint { label: string; rule: string; eg?: string; note?: string }

export interface PracticeSpec {
  /** Conjugation-driven practice (enables generated drills). */
  conj?: { verbs: string[]; tense: Tense; subjects?: Subject[]; negative?: boolean };
  /** Generated transformation kind. */
  transform?: "negation" | "question" | "passe_compose" | "futur_proche" | "formal";
  /** Pull from banks of these skills too (for review-style skills). */
  includeSkills?: string[];
  /** Exercise types this skill favours, in recognition → production order. */
  types: ExerciseType[];
}

export interface SkillDef {
  id: string;
  week: number;
  order: number;
  title: string;
  short: string;
  cefr: CEFR;
  category: SkillCategory;
  summary: string;
  objectives: string[];
  explanation: ExplanationSection[];
  tip?: string;
  practice: PracticeSpec;
}

export interface WeekDef {
  number: number;
  title: string;
  focus: string;
  cefr: CEFR;
  description: string;
}

export interface BankSentence {
  id: string;
  fr: string;
  /** Additional accepted French renderings (patterns allowed). */
  alts?: string[];
  en: string;
  /** Wrong tiles to add to sentence builders. */
  distractors?: string[];
  note?: string;
}

export interface McqItem {
  id: string;
  /** Use "___" for the gap. */
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  en?: string;
  /** French audio for listening-comprehension questions. */
  audio?: string;
  /** If true it can also be used as a typed fill-in-the-blank. */
  typeable?: boolean;
}

export interface TransformItem {
  id: string;
  kind: string;
  from: string;
  to: string[];
  explanation: string;
}

export interface DialogueItem {
  id: string;
  context: string;
  lines: DialogueLine[];
  options: { fr: string; en: string; correct: boolean; why: string }[];
}

/**
 * A hand-written conjugation drill (courses without a conjugation engine, e.g. German):
 * "wohnen → du" with the accepted verb forms.
 */
export interface DrillItem {
  id: string;
  verb: string;
  subject: string;
  /** Accepted verb forms without the subject, e.g. ["wohnst"]; "[a|b]" patterns allowed. */
  answer: string[];
  /** Full sentence with subject, e.g. "Du wohnst in Berlin." (audio and translation exercises). */
  sentence?: string;
  en: string;
  /** Tense / form label shown under the prompt, e.g. "Präsens". */
  form: string;
  explanation: string;
  hint?: string;
  /** Common wrong forms with targeted explanations. */
  wrong?: { text: string; why: string }[];
}

export interface SkillBank {
  sentences?: BankSentence[];
  mcq?: McqItem[];
  transforms?: TransformItem[];
  dialogues?: DialogueItem[];
  drills?: DrillItem[];
}
