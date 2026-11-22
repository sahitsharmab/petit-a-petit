import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
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

/** Insert a lesson and its exercises atomically (one batch, one round trip). */
async function insertLesson(db: DB, lesson: typeof schema.generatedLessons.$inferInsert, exercises: Exercise[]) {
  const q: BatchItem<"sqlite">[] = [db.insert(schema.generatedLessons).values(lesson)];
  if (exercises.length) {
    q.push(db.insert(schema.exercises).values(exercises.map((e, i) => ({
      id: e.id, lessonId: lesson.id!, position: i, type: e.type, skillId: e.skillId, section: e.section, itemKey: e.itemKey, payload: e,
    }))));
  }
  await db.batch(q as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
}

export async function getDailyLesson(db: DB, date: string): Promise<LessonRecord | null> {
  const row = await db.select().from(schema.generatedLessons).where(eq(schema.generatedLessons.dailyKey, date)).get();
  return row ? toRecord(row) : null;
}

/** What today's lesson will be (without creating it) — for the dashboard. */
export async function previewToday(db: DB, now: Date = new Date()): Promise<{ lesson: LessonRecord | null; plan: LessonPlan }> {
  const today = parisDate(now);
  const lesson = await getDailyLesson(db, today);
  const plan = planDailyLesson(await loadPlannerInput(db, today));
  return { lesson, plan };
}

/** In-flight creations per database (each learner has their own). */
const creating = new WeakMap<DB, Map<string, Promise<LessonRecord>>>();

/**
 * Get today's daily lesson, creating it exactly once per Paris date.
 * Reloads, concurrent requests and restarts all return the same lesson. Across server
 * instances the unique daily key decides: a losing insert returns the winner's lesson.
 */
export async function getOrCreateDailyLesson(db: DB, now: Date = new Date(), enhancer?: LessonEnhancer): Promise<LessonRecord> {
  const today = parisDate(now);
  const existing = await getDailyLesson(db, today);
  if (existing) return existing;
  let jobs = creating.get(db);
  if (!jobs) creating.set(db, (jobs = new Map()));
  const inflight = jobs.get(today);
  if (inflight) return inflight;

  const job = (async () => {
    const input = await loadPlannerInput(db, today);
    const plan = planDailyLesson(input);
    const id = `L${today.replace(/-/g, "")}-${shortId()}`;
    const seed = hashString(`${today}:${plan.primarySkillId}`);
    let exercises = assembleLesson({
      lessonId: id, templateId: plan.templateId, primarySkillId: plan.primarySkillId, reviewKeys: plan.reviewKeys,
      weekNumber: plan.weekNumber, seed, recentItemKeys: await recentItemKeys(db),
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
    const again = await getDailyLesson(db, today);
    if (again) return again;
    try {
      await insertLesson(db, {
        id, kind: "daily", lessonDate: today, dailyKey: today, primarySkillId: plan.primarySkillId, reviewSkillIds: plan.reviewSkillIds,
        templateId: plan.templateId, weekNumber: plan.weekNumber, dayNumber: plan.dayNumber, title: plan.title, subtitle: plan.subtitle,
        mode: plan.mode, source, intro, seed,
      }, exercises);
    } catch (err) {
      // Another server instance created today's lesson first.
      const winner = await getDailyLesson(db, today);
      if (winner) return winner;
      throw err;
    }
    return (await getDailyLesson(db, today))!;
  })();
  jobs.set(today, job);
  try {
    return await job;
  } finally {
    jobs.delete(today);
  }
}

export type PracticeRequest = { kind: "skill"; skillId: string } | { kind: "week"; week: number } | { kind: "review" };

export async function createPracticeLesson(db: DB, req: PracticeRequest, now: Date = new Date()): Promise<LessonRecord> {
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
    const input = await loadPlannerInput(db, today);
    const plan = planDailyLesson(input);
    reviewKeys = chooseReviewKeys(input, "", 9);
    primary = reviewKeys[0]?.startsWith("skill:") ? reviewKeys[0].slice(6) : input.dueItems[0]?.skillId ?? frontierSkill({ progress: await loadProgress(db) });
    if (!reviewKeys.length) reviewKeys = [`skill:${plan.primarySkillId}`];
    templateId = "review-mix";
    title = "Review session";
    subtitle = "Spaced repetition";
    week = getSkill(primary).week;
  }
  const exercises = assembleLesson({ lessonId: id, templateId, primarySkillId: primary, reviewKeys, weekNumber: week, seed, recentItemKeys: await recentItemKeys(db) });
  const intro = introFor(primary, templateId, []);
  await insertLesson(db, {
    id, kind: req.kind === "review" ? "review" : "practice", lessonDate: today, dailyKey: null, primarySkillId: primary,
    reviewSkillIds: [], templateId, weekNumber: week, dayNumber: 0, title, subtitle, mode: "practice", source: "local", intro, seed,
  }, exercises);
  return (await getLesson(db, id))!;
}

export async function getLesson(db: DB, id: string): Promise<LessonRecord | null> {
  const row = await db.select().from(schema.generatedLessons).where(eq(schema.generatedLessons.id, id)).get();
  return row ? toRecord(row) : null;
}

export async function getLessonExercises(db: DB, lessonId: string): Promise<Exercise[]> {
  return (await db.select().from(schema.exercises).where(eq(schema.exercises.lessonId, lessonId)).orderBy(asc(schema.exercises.position)).all())
    .map((r) => r.payload as Exercise);
}

export async function latestSessionForLesson(db: DB, lessonId: string) {
  return (await db.select().from(schema.lessonSessions).where(eq(schema.lessonSessions.lessonId, lessonId))
    .orderBy(desc(schema.lessonSessions.startedAt)).get()) ?? null;
}

export async function lessonsForDate(db: DB, date: string) {
  return db.select().from(schema.generatedLessons).where(and(eq(schema.generatedLessons.lessonDate, date))).all();
}
