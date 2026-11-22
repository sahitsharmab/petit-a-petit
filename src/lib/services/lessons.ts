import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { SKILLS, WEEKS, getSkill } from "@/lib/content/curriculum";
import { hashString } from "@/lib/content/generate";
import { TEMPLATE_BY_ID } from "@/lib/content/templates";
import type { Exercise, ExplanationSection } from "@/lib/content/types";
import { assembleLesson } from "@/lib/learning/assemble";
import { parisDate } from "@/lib/learning/dates";
import { chooseReviewKeys, frontierSkill, planDailyLesson, type LessonPlan } from "@/lib/learning/planner";
import { loadPlannerInput, loadProgress, recentItemKeys } from "./progress";

export interface LessonIntro {
  objectives: string[];
  explanation: ExplanationSection[];
  tip: string | null;
  rationale: string[];
  showExplanation: boolean;
  /** Optional AI additions (validated). */
  aiIntro?: string;
  aiExamples?: { fr: string; en: string }[];
  aiNote?: string;
}

export interface LessonRecord {
  id: string;
  kind: string;
  lessonDate: string;
  primarySkillId: string;
  reviewSkillIds: string[];
  templateId: string;
  weekNumber: number;
  dayNumber: number;
  title: string;
  subtitle: string;
  mode: string;
  source: string;
  intro: LessonIntro;
  createdAt: string;
}

/** Optional hook (AI mode) that may enrich a freshly assembled lesson. */
export type LessonEnhancer = (input: {
  plan: LessonPlan;
  exercises: Exercise[];
  intro: LessonIntro;
  recentMistakeLabels: string[];
}) => Promise<{ exercises: Exercise[]; intro: LessonIntro; source: "ai" | "mixed" } | null>;

const shortId = () => randomUUID().replace(/-/g, "").slice(0, 12);

function toRecord(row: typeof schema.generatedLessons.$inferSelect): LessonRecord {
  return { ...row, reviewSkillIds: row.reviewSkillIds ?? [], intro: row.intro as LessonIntro };
}

function introFor(skillId: string, templateId: string, rationale: string[]): LessonIntro {
  const s = getSkill(skillId);
  return {
    objectives: s.objectives,
    explanation: s.explanation,
    tip: s.tip ?? null,
    rationale,
    showExplanation: TEMPLATE_BY_ID[templateId]?.showExplanation ?? true,
  };
}

function insertLesson(db: DB, lesson: typeof schema.generatedLessons.$inferInsert, exercises: Exercise[]) {
  db.transaction((tx) => {
    tx.insert(schema.generatedLessons).values(lesson).run();
    exercises.forEach((e, i) => {
      tx.insert(schema.exercises).values({
        id: e.id, lessonId: lesson.id!, position: i, type: e.type, skillId: e.skillId, section: e.section, itemKey: e.itemKey, payload: e,
      }).run();
    });
  });
}

export function getDailyLesson(db: DB, date: string): LessonRecord | null {
  const row = db.select().from(schema.generatedLessons).where(eq(schema.generatedLessons.dailyKey, date)).get();
  return row ? toRecord(row) : null;
}

/** What today's lesson will be (without creating it) — for the dashboard. */
export function previewToday(db: DB, now: Date = new Date()): { lesson: LessonRecord | null; plan: LessonPlan } {
  const today = parisDate(now);
  const lesson = getDailyLesson(db, today);
  const plan = planDailyLesson(loadPlannerInput(db, today));
  return { lesson, plan };
}

const creating = new Map<string, Promise<LessonRecord>>();

/**
 * Get today's daily lesson, creating it exactly once per Paris date.
 * Reloads, concurrent requests and restarts all return the same lesson.
 */
export async function getOrCreateDailyLesson(db: DB, now: Date = new Date(), enhancer?: LessonEnhancer): Promise<LessonRecord> {
  const today = parisDate(now);
  const existing = getDailyLesson(db, today);
  if (existing) return existing;
  const inflight = creating.get(today);
  if (inflight) return inflight;

  const job = (async () => {
    const input = loadPlannerInput(db, today);
    const plan = planDailyLesson(input);
    const id = `L${today.replace(/-/g, "")}-${shortId()}`;
    const seed = hashString(`${today}:${plan.primarySkillId}`);
    let exercises = assembleLesson({
      lessonId: id, templateId: plan.templateId, primarySkillId: plan.primarySkillId, reviewKeys: plan.reviewKeys,
      weekNumber: plan.weekNumber, seed, recentItemKeys: recentItemKeys(db),
    });
    let intro = introFor(plan.primarySkillId, plan.templateId, plan.rationale);
    let source: "local" | "ai" | "mixed" = "local";
    if (enhancer) {
      try {
        const res = await enhancer({ plan, exercises, intro, recentMistakeLabels: input.recentMistakes.map((m) => m.label) });
        if (res) ({ exercises, intro, source } = res);
      } catch (err) {
        console.warn("[lesson] AI enhancement failed, using local content:", (err as Error).message);
      }
    }
    const again = getDailyLesson(db, today);
    if (again) return again;
    insertLesson(db, {
      id, kind: "daily", lessonDate: today, dailyKey: today, primarySkillId: plan.primarySkillId, reviewSkillIds: plan.reviewSkillIds,
      templateId: plan.templateId, weekNumber: plan.weekNumber, dayNumber: plan.dayNumber, title: plan.title, subtitle: plan.subtitle,
      mode: plan.mode, source, intro, seed,
    }, exercises);
    return getDailyLesson(db, today)!;
  })();
  creating.set(today, job);
  try {
    return await job;
  } finally {
    creating.delete(today);
  }
}

export type PracticeRequest = { kind: "skill"; skillId: string } | { kind: "week"; week: number } | { kind: "review" };

export function createPracticeLesson(db: DB, req: PracticeRequest, now: Date = new Date()): LessonRecord {
  const today = parisDate(now);
  const id = `P${today.replace(/-/g, "")}-${shortId()}`;
  const seed = hashString(id);
  let templateId: string;
  let primary: string;
  let title: string;
  let subtitle: string;
  let week: number;
  let reviewKeys: string[] = [];
  if (req.kind === "skill") {
    const s = getSkill(req.skillId);
    primary = s.id;
    templateId = s.id === "w12-assessment" ? "assessment" : "practice-skill";
    title = s.title;
    subtitle = "Targeted practice";
    week = s.week;
  } else if (req.kind === "week") {
    const w = WEEKS.find((x) => x.number === req.week);
    if (!w) throw new Error("Unknown week");
    primary = SKILLS.find((s) => s.week === w.number)!.id;
    templateId = "practice-week";
    title = `Week ${w.number}: ${w.title}`;
    subtitle = "Week revision";
    week = w.number;
  } else {
    const input = loadPlannerInput(db, today);
    const plan = planDailyLesson(input);
    reviewKeys = chooseReviewKeys(input, "", 9);
    primary = reviewKeys[0]?.startsWith("skill:") ? reviewKeys[0].slice(6) : input.dueItems[0]?.skillId ?? frontierSkill({ progress: loadProgress(db) });
    if (!reviewKeys.length) reviewKeys = [`skill:${plan.primarySkillId}`];
    templateId = "review-mix";
    title = "Review session";
    subtitle = "Spaced repetition";
    week = getSkill(primary).week;
  }
  const exercises = assembleLesson({ lessonId: id, templateId, primarySkillId: primary, reviewKeys, weekNumber: week, seed, recentItemKeys: recentItemKeys(db) });
  const intro = introFor(primary, templateId, []);
  insertLesson(db, {
    id, kind: req.kind === "review" ? "review" : "practice", lessonDate: today, dailyKey: null, primarySkillId: primary,
    reviewSkillIds: [], templateId, weekNumber: week, dayNumber: 0, title, subtitle, mode: "practice", source: "local", intro, seed,
  }, exercises);
  return getLesson(db, id)!;
}

export function getLesson(db: DB, id: string): LessonRecord | null {
  const row = db.select().from(schema.generatedLessons).where(eq(schema.generatedLessons.id, id)).get();
  return row ? toRecord(row) : null;
}

export function getLessonExercises(db: DB, lessonId: string): Exercise[] {
  return db.select().from(schema.exercises).where(eq(schema.exercises.lessonId, lessonId)).orderBy(asc(schema.exercises.position)).all()
    .map((r) => r.payload as Exercise);
}

export function latestSessionForLesson(db: DB, lessonId: string) {
  return db.select().from(schema.lessonSessions).where(eq(schema.lessonSessions.lessonId, lessonId))
    .orderBy(desc(schema.lessonSessions.startedAt)).get() ?? null;
}

export function lessonsForDate(db: DB, date: string) {
  return db.select().from(schema.generatedLessons).where(and(eq(schema.generatedLessons.lessonDate, date))).all();
}
