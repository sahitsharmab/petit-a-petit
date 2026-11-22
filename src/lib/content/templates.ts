import type { ExerciseType, LessonSection } from "./types";

export interface TemplateBlock {
  section: LessonSection;
  /** "review" pulls due items; "primary" uses the lesson's main skill. */
  from: "review" | "primary" | "week";
  count: number;
  /** Explicit types, otherwise taken from the skill's practice spec. */
  types?: ExerciseType[];
}

export interface LessonTemplateDef {
  id: string;
  name: string;
  description: string;
  showExplanation: boolean;
  blocks: TemplateBlock[];
}

export const TEMPLATES: LessonTemplateDef[] = [
  {
    id: "daily-standard",
    name: "Daily lesson",
    description: "Warm-up review, one new concept, practice, a sentence to build and a short conversation.",
    showExplanation: true,
    blocks: [
      { section: "warmup", from: "review", count: 3 },
      { section: "core", from: "primary", count: 6 },
      { section: "build", from: "primary", count: 1, types: ["sentence_builder"] },
      { section: "conversation", from: "primary", count: 1, types: ["dialogue"] },
    ],
  },
  {
    id: "daily-consolidate",
    name: "Extra practice day",
    description: "The same concept again, with more production practice, because it needs more time.",
    showExplanation: true,
    blocks: [
      { section: "warmup", from: "review", count: 2 },
      { section: "core", from: "primary", count: 7 },
      { section: "build", from: "primary", count: 1, types: ["sentence_builder"] },
      { section: "conversation", from: "primary", count: 1, types: ["dialogue"] },
    ],
  },
  {
    id: "welcome-back",
    name: "Welcome back",
    description: "A gentle restart after a break: a longer warm-up, then the next concept.",
    showExplanation: true,
    blocks: [
      { section: "warmup", from: "review", count: 4 },
      { section: "core", from: "primary", count: 5 },
      { section: "build", from: "primary", count: 1, types: ["sentence_builder"] },
      { section: "conversation", from: "primary", count: 1, types: ["dialogue"] },
    ],
  },
  {
    id: "practice-skill",
    name: "Targeted practice",
    description: "Focused practice on a single skill.",
    showExplanation: true,
    blocks: [
      { section: "core", from: "primary", count: 7 },
      { section: "build", from: "primary", count: 1, types: ["sentence_builder"] },
    ],
  },
  {
    id: "practice-week",
    name: "Week revision",
    description: "Mixed practice across every skill in a curriculum week.",
    showExplanation: false,
    blocks: [{ section: "core", from: "week", count: 9 }],
  },
  {
    id: "review-mix",
    name: "Review session",
    description: "Everything that is due for review, weakest items first.",
    showExplanation: false,
    blocks: [{ section: "warmup", from: "review", count: 9 }],
  },
  {
    id: "assessment",
    name: "Readiness check",
    description: "A balanced test across the whole course.",
    showExplanation: true,
    blocks: [{ section: "core", from: "primary", count: 14 }],
  },
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
