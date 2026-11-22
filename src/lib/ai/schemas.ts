import { z } from "zod";

const french = z.string().trim().min(1).max(220);
const english = z.string().trim().min(1).max(260);

export const AiMcq = z.object({
  type: z.literal("multiple_choice"),
  prompt: z.string().trim().min(3).max(220),
  options: z.array(z.string().trim().min(1).max(160)).min(3).max(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(5).max(400),
});

export const AiFill = z.object({
  type: z.literal("fill_blank"),
  /** Must contain exactly one "___". */
  sentence: z.string().trim().min(5).max(220),
  answer: z.string().trim().min(1).max(60),
  alsoAccept: z.array(z.string().trim().min(1).max(60)).max(4).default([]),
  english: english,
  explanation: z.string().trim().min(5).max(400),
});

export const AiTranslation = z.object({
  type: z.literal("translation"),
  english: english,
  french: french,
  alsoAccept: z.array(french).max(6).default([]),
  explanation: z.string().trim().min(5).max(400),
});

export const AiDialogue = z.object({
  type: z.literal("dialogue"),
  context: z.string().trim().min(5).max(200),
  line: french,
  lineEnglish: english,
  options: z.array(z.object({ fr: french, en: english, correct: z.boolean(), why: z.string().trim().min(3).max(300) })).min(3).max(3),
});

export const AiExercise = z.discriminatedUnion("type", [AiMcq, AiFill, AiTranslation, AiDialogue]);

export const LessonEnhancementSchema = z.object({
  skillId: z.string(),
  cefr: z.enum(["A1", "A2", "B1"]),
  intro: z.string().trim().min(20).max(600),
  examples: z.array(z.object({ fr: french, en: english })).min(2).max(4),
  exercises: z.array(AiExercise).min(1).max(4),
});
export type LessonEnhancement = z.infer<typeof LessonEnhancementSchema>;

export const JudgeSchema = z.object({
  isCorrect: z.boolean(),
  correctedAnswer: z.string().trim().max(300),
  explanation: z.string().trim().min(3).max(500),
  mistakeType: z.enum(["none", "conjugation", "agreement", "gender", "word-order", "vocabulary", "spelling", "tense", "negation", "other"]).default("other"),
});
export type JudgeResult = z.infer<typeof JudgeSchema>;

export const ConversationTurnSchema = z.object({
  reply: z.string().trim().min(1).max(500),
  replyEnglish: z.string().trim().min(1).max(600),
  /** Gentle correction of the learner's last message, or null if fine. */
  correction: z.object({ original: z.string().max(400), corrected: z.string().max(400), explanation: z.string().max(400) }).nullable().default(null),
  suggestions: z.array(z.object({ fr: z.string().max(200), en: z.string().max(240) })).max(3).default([]),
  done: z.boolean().default(false),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

export const ConversationSummarySchema = z.object({
  summary: z.string().trim().min(5).max(800),
  corrections: z.array(z.object({ original: z.string().max(300), corrected: z.string().max(300), explanation: z.string().max(300) })).max(8).default([]),
  vocabulary: z.array(z.object({ fr: z.string().max(120), en: z.string().max(160) })).max(10).default([]),
  reviewSkillIds: z.array(z.string()).max(4).default([]),
  encouragement: z.string().max(300).default(""),
});
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

export const HelpSchema = z.object({ text: z.string().trim().min(1).max(700) });
