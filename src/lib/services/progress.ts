import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import type { Exercise } from "@/lib/content/types";
import { SKILLS, getSkill } from "@/lib/content/curriculum";
import { conjugate, type Subject, type Tense } from "@/lib/french/conjugate";
import type { Verdict } from "@/lib/french/evaluate";
import { addDays } from "@/lib/learning/dates";
import { EMPTY_MASTERY, creditFor, isPassed, updateMastery, type MasteryState } from "@/lib/learning/mastery";
import type { PlannerInput, RecentMistake, SkillProgress } from "@/lib/learning/planner";
import { qualityFor, qualityFromAccuracy, scheduleReview } from "@/lib/learning/srs";

/** Human label for a review item, e.g. « tu parles » or the sentence itself. */
export function labelForExercise(ex: Pick<Exercise, "itemKey" | "prompt" | "translation" | "audioText" | "type">): string {
  const parts = ex.itemKey.split(":");
  const conjPart = parts[0] === "conj" ? parts : parts[0] === "gtr" ? parts.slice(2) : null;
  if (conjPart && conjPart[0] === "conj") {
    try {
      return conjugate(conjPart[1], conjPart[2] as Tense, conjPart[3] as Subject, { negative: conjPart[4] === "neg" }).full;
    } catch { /* fall through */ }
  }
  const text = ["translation", "sentence_builder", "listening"].includes(ex.type) ? ex.audioText ?? ex.prompt : ex.prompt;
  return text.length > 60 ? text.slice(0, 57) + "…" : text;
}

export function loadProgress(db: DB): Record<string, SkillProgress> {
  const rows = db.select().from(schema.skillMastery).all();
  return Object.fromEntries(rows.map((r) => [r.skillId, { ...r, status: r.status as MasteryState["status"] }]));
}

function masteryRow(db: DB, skillId: string): MasteryState {
  const r = db.select().from(schema.skillMastery).where(eq(schema.skillMastery.skillId, skillId)).get();
  return r ? { ...r, status: r.status as MasteryState["status"] } : { ...EMPTY_MASTERY };
}

function saveMastery(db: DB, skillId: string, m: MasteryState, nowIso: string) {
  const { attempts, correct, incorrect, mastery, consecutiveCorrect, lessonsAsPrimary, status } = m;
  const values = { attempts, correct, incorrect, mastery, consecutiveCorrect, lessonsAsPrimary, status };
  const passed = isPassed(m) ? nowIso : null;
  db.insert(schema.skillMastery)
    .values({ skillId, ...values, firstPracticedAt: nowIso, lastPracticedAt: nowIso, passedAt: passed })
    .onConflictDoUpdate({
      target: schema.skillMastery.skillId,
      set: {
        ...values, lastPracticedAt: nowIso,
        firstPracticedAt: sql`coalesce(${schema.skillMastery.firstPracticedAt}, ${nowIso})`,
        passedAt: sql`coalesce(${schema.skillMastery.passedAt}, ${passed})`,
      },
    })
    .run();
}

/** Apply a first-attempt result to mastery and the item's review schedule. */
export function applyFirstAttempt(db: DB, ex: Exercise, verdict: Verdict, hintsUsed: number, today: string, nowIso: string) {
  const credit = creditFor(verdict, hintsUsed);
  const skills = [ex.skillId, typeof ex.meta?.parentSkill === "string" ? ex.meta.parentSkill : null].filter(Boolean) as string[];
  for (const sid of skills) saveMastery(db, sid, updateMastery(masteryRow(db, sid), credit), nowIso);

  const prev = db.select().from(schema.reviewSchedule).where(eq(schema.reviewSchedule.itemKey, ex.itemKey)).get();
  const next = scheduleReview(prev ?? undefined, qualityFor(verdict, hintsUsed), today);
  const good = verdict !== "incorrect";
  db.insert(schema.reviewSchedule)
    .values({
      itemKey: ex.itemKey, itemType: ex.itemKey.split(":")[0], skillId: ex.skillId, label: labelForExercise(ex),
      ...next, attempts: 1, correct: good ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: schema.reviewSchedule.itemKey,
      set: {
        ...next,
        attempts: sql`${schema.reviewSchedule.attempts} + 1`,
        correct: sql`${schema.reviewSchedule.correct} + ${good ? 1 : 0}`,
      },
    })
    .run();
}

/** Skill-level spaced review, updated once per completed lesson. */
export function applySkillReview(db: DB, skillId: string, accuracy: number, today: string) {
  const key = `skill:${skillId}`;
  const prev = db.select().from(schema.reviewSchedule).where(eq(schema.reviewSchedule.itemKey, key)).get();
  const next = scheduleReview(prev ?? undefined, qualityFromAccuracy(accuracy), today);
  db.insert(schema.reviewSchedule)
    .values({ itemKey: key, itemType: "skill", skillId, label: getSkill(skillId).title, ...next, attempts: 1, correct: accuracy >= 0.6 ? 1 : 0 })
    .onConflictDoUpdate({ target: schema.reviewSchedule.itemKey, set: { ...next, attempts: sql`${schema.reviewSchedule.attempts} + 1` } })
    .run();
}

export function incrementPrimary(db: DB, skillId: string, nowIso: string) {
  const m = masteryRow(db, skillId);
  saveMastery(db, skillId, { ...m, lessonsAsPrimary: m.lessonsAsPrimary + 1 }, nowIso);
}

/** Items answered wrongly in the last 14 days that haven't been answered correctly since. */
export function loadRecentMistakes(db: DB, today: string): RecentMistake[] {
  const since = addDays(today, -14);
  const rows = db.select({
    itemKey: schema.exerciseAttempts.itemKey, skillId: schema.exerciseAttempts.skillId,
    isCorrect: schema.exerciseAttempts.isCorrect, studyDate: schema.exerciseAttempts.studyDate, id: schema.exerciseAttempts.id,
  }).from(schema.exerciseAttempts)
    .where(and(eq(schema.exerciseAttempts.isFirst, true), gte(schema.exerciseAttempts.studyDate, since), lte(schema.exerciseAttempts.studyDate, today)))
    .orderBy(schema.exerciseAttempts.id).all();
  const byKey = new Map<string, { skillId: string; count: number; lastDate: string; resolved: boolean }>();
  for (const r of rows) {
    const cur = byKey.get(r.itemKey) ?? { skillId: r.skillId, count: 0, lastDate: r.studyDate, resolved: false };
    if (!r.isCorrect) {
      cur.count += 1;
      cur.lastDate = r.studyDate;
      cur.resolved = false;
    } else if (cur.count > 0) cur.resolved = true;
    byKey.set(r.itemKey, cur);
  }
  const keys = [...byKey.entries()].filter(([, v]) => v.count > 0 && !v.resolved);
  if (!keys.length) return [];
  const labels = new Map(
    db.select({ k: schema.reviewSchedule.itemKey, l: schema.reviewSchedule.label }).from(schema.reviewSchedule)
      .where(inArray(schema.reviewSchedule.itemKey, keys.map(([k]) => k))).all().map((r) => [r.k, r.l]),
  );
  return keys.map(([itemKey, v]) => ({ itemKey, skillId: v.skillId, count: v.count, lastDate: v.lastDate, label: labels.get(itemKey) ?? itemKey }));
}

export function loadStudyDates(db: DB): string[] {
  const lessons = db.selectDistinct({ d: schema.lessonSessions.studyDate }).from(schema.lessonSessions)
    .where(eq(schema.lessonSessions.status, "completed")).all();
  const convos = db.selectDistinct({ d: schema.conversationSessions.studyDate }).from(schema.conversationSessions)
    .where(eq(schema.conversationSessions.status, "completed")).all();
  return [...new Set([...lessons, ...convos].map((r) => r.d))].sort();
}

export function loadPlannerInput(db: DB, today: string): PlannerInput {
  const dueItems = db.select().from(schema.reviewSchedule).where(lte(schema.reviewSchedule.dueDate, today)).all()
    .map((r) => ({ itemKey: r.itemKey, skillId: r.skillId, label: r.label, dueDate: r.dueDate, ease: r.ease, lapses: r.lapses }))
    .filter((r) => SKILLS.some((s) => s.id === r.skillId));
  const before = loadStudyDates(db).filter((d) => d < today);
  const daily = db.select({ week: schema.generatedLessons.weekNumber, n: sql<number>`count(*)` }).from(schema.generatedLessons)
    .where(and(eq(schema.generatedLessons.kind, "daily"), sql`${schema.generatedLessons.lessonDate} < ${today}`))
    .groupBy(schema.generatedLessons.weekNumber).all();
  return {
    today,
    progress: loadProgress(db),
    dueItems,
    recentMistakes: loadRecentMistakes(db, today),
    lastStudyDate: before[before.length - 1] ?? null,
    dailyLessonsByWeek: Object.fromEntries(daily.map((d) => [d.week, Number(d.n)])),
  };
}

/** Item keys from the most recent lessons, to avoid exact repeats. */
export function recentItemKeys(db: DB, lessons = 4): string[] {
  const ids = db.select({ id: schema.generatedLessons.id }).from(schema.generatedLessons)
    .orderBy(desc(schema.generatedLessons.createdAt)).limit(lessons).all().map((r) => r.id);
  if (!ids.length) return [];
  return db.select({ k: schema.exercises.itemKey }).from(schema.exercises).where(inArray(schema.exercises.lessonId, ids)).all().map((r) => r.k);
}
