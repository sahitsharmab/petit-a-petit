import { and, desc, eq, gte, inArray, like, lte, sql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import type { Exercise } from "@/lib/content/types";
import { SKILL_BY_ID, courseSkills, getSkill } from "@/lib/content/curriculum";
import { langOfSkill } from "@/lib/content/languages";
import { conjugate, type Subject, type Tense } from "@/lib/french/conjugate";
import type { Verdict } from "@/lib/french/evaluate";
import { addDays } from "@/lib/learning/dates";
import { EMPTY_MASTERY, creditFor, isPassed, updateMastery, type MasteryState } from "@/lib/learning/mastery";
import type { PlannerInput, RecentMistake, SkillProgress } from "@/lib/learning/planner";
import { qualityFor, qualityFromAccuracy, scheduleReview } from "@/lib/learning/srs";
import { PATTERN_WINDOW_DAYS, nousFocus, type FocusPattern } from "@/lib/learning/patterns";
import { getVerb } from "@/lib/french/verbs";

/** Human label for a review item, e.g. « tu parles » or the sentence itself. */
export function labelForExercise(ex: Pick<Exercise, "itemKey" | "prompt" | "translation" | "audioText" | "type">): string {
  const parts = ex.itemKey.split(":");
  const conjPart = parts[0] === "conj" ? parts : parts[0] === "gtr" ? parts.slice(2) : null;
  if (conjPart && conjPart[0] === "conj") {
    try {
      return conjugate(conjPart[1], conjPart[2] as Tense, conjPart[3] as Subject, { negative: conjPart[4] === "neg" }).full;
    } catch { /* fall through */ }
  }
  const text = ["translation", "sentence_builder", "listening"].includes(ex.type) || parts[0] === "drill" ? ex.audioText ?? ex.prompt : ex.prompt;
  return text.length > 60 ? text.slice(0, 57) + "…" : text;
}

export async function loadProgress(db: DB): Promise<Record<string, SkillProgress>> {
  const rows = await db.select().from(schema.skillMastery).all();
  return Object.fromEntries(rows.map((r) => [r.skillId, { ...r, status: r.status as MasteryState["status"] }]));
}

async function masteryRow(db: DB, skillId: string): Promise<MasteryState> {
  const r = await db.select().from(schema.skillMastery).where(eq(schema.skillMastery.skillId, skillId)).get();
  return r ? { ...r, status: r.status as MasteryState["status"] } : { ...EMPTY_MASTERY };
}

async function saveMastery(db: DB, skillId: string, m: MasteryState, nowIso: string) {
  const { attempts, correct, incorrect, mastery, consecutiveCorrect, lessonsAsPrimary, status } = m;
  const values = { attempts, correct, incorrect, mastery, consecutiveCorrect, lessonsAsPrimary, status };
  const passed = isPassed(m) ? nowIso : null;
  await db.insert(schema.skillMastery)
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
export async function applyFirstAttempt(db: DB, ex: Exercise, verdict: Verdict, hintsUsed: number, today: string, nowIso: string) {
  const credit = creditFor(verdict, hintsUsed);
  const skills = [ex.skillId, typeof ex.meta?.parentSkill === "string" ? ex.meta.parentSkill : null].filter(Boolean) as string[];
  for (const sid of skills) await saveMastery(db, sid, updateMastery(await masteryRow(db, sid), credit), nowIso);

  const prev = await db.select().from(schema.reviewSchedule).where(eq(schema.reviewSchedule.itemKey, ex.itemKey)).get();
  const next = scheduleReview(prev ?? undefined, qualityFor(verdict, hintsUsed), today);
  const good = verdict !== "incorrect";
  await db.insert(schema.reviewSchedule)
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
export async function applySkillReview(db: DB, skillId: string, accuracy: number, today: string) {
  const key = `skill:${skillId}`;
  const prev = await db.select().from(schema.reviewSchedule).where(eq(schema.reviewSchedule.itemKey, key)).get();
  const next = scheduleReview(prev ?? undefined, qualityFromAccuracy(accuracy), today);
  await db.insert(schema.reviewSchedule)
    .values({ itemKey: key, itemType: "skill", skillId, label: getSkill(skillId).title, ...next, attempts: 1, correct: accuracy >= 0.6 ? 1 : 0 })
    .onConflictDoUpdate({ target: schema.reviewSchedule.itemKey, set: { ...next, attempts: sql`${schema.reviewSchedule.attempts} + 1` } })
    .run();
}

export async function incrementPrimary(db: DB, skillId: string, nowIso: string) {
  const m = await masteryRow(db, skillId);
  await saveMastery(db, skillId, { ...m, lessonsAsPrimary: m.lessonsAsPrimary + 1 }, nowIso);
}

/** Items answered wrongly in the last 14 days that haven't been answered correctly since. */
export async function loadRecentMistakes(db: DB, today: string): Promise<RecentMistake[]> {
  const since = addDays(today, -14);
  const rows = await db.select({
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
  const labelRows = await db.select({ k: schema.reviewSchedule.itemKey, l: schema.reviewSchedule.label }).from(schema.reviewSchedule)
    .where(inArray(schema.reviewSchedule.itemKey, keys.map(([k]) => k))).all();
  const labels = new Map(labelRows.map((r) => [r.k, r.l]));
  return keys.map(([itemKey, v]) => ({ itemKey, skillId: v.skillId, count: v.count, lastDate: v.lastDate, label: labels.get(itemKey) ?? itemKey }));
}

export async function loadStudyDates(db: DB): Promise<string[]> {
  const lessons = await db.selectDistinct({ d: schema.lessonSessions.studyDate }).from(schema.lessonSessions)
    .where(eq(schema.lessonSessions.status, "completed")).all();
  const convos = await db.selectDistinct({ d: schema.conversationSessions.studyDate }).from(schema.conversationSessions)
    .where(eq(schema.conversationSessions.status, "completed")).all();
  return [...new Set([...lessons, ...convos].map((r) => r.d))].sort();
}

/** The active cross-item error pattern, if any (currently « nous » endings). */
export async function loadFocusPattern(db: DB, today: string, progress?: Record<string, SkillProgress>): Promise<FocusPattern | null> {
  progress ??= await loadProgress(db);
  const since = addDays(today, -PATTERN_WINDOW_DAYS);
  const attempts = (await db.select({
    id: schema.exerciseAttempts.id, itemKey: schema.exerciseAttempts.itemKey, verdict: schema.exerciseAttempts.verdict,
    hintsUsed: schema.exerciseAttempts.hintsUsed, studyDate: schema.exerciseAttempts.studyDate, isFirst: schema.exerciseAttempts.isFirst,
  }).from(schema.exerciseAttempts)
    .where(and(eq(schema.exerciseAttempts.isFirst, true), gte(schema.exerciseAttempts.studyDate, since), like(schema.exerciseAttempts.itemKey, "%:nous%")))
    .all()).map((a) => ({ ...a, verdict: a.verdict as Verdict }));
  // Fresh-verb candidates: verbs from conjugation topics the learner has already practised.
  const verbsByTense: Record<string, string[]> = {};
  for (const s of courseSkills(db.lang)) {
    const conj = s.practice.conj;
    if (!conj || conj.negative || !(progress[s.id]?.attempts > 0)) continue;
    const list = (verbsByTense[conj.tense] ??= []);
    for (const v of conj.verbs) if (!list.includes(v) && !getVerbSafe(v)?.reflexive) list.push(v);
  }
  return nousFocus(attempts, today, verbsByTense);
}

function getVerbSafe(v: string) {
  try { return getVerb(v); } catch { return null; }
}

export async function loadPlannerInput(db: DB, today: string): Promise<PlannerInput> {
  const dueItems = (await db.select().from(schema.reviewSchedule).where(lte(schema.reviewSchedule.dueDate, today)).all())
    .map((r) => ({ itemKey: r.itemKey, skillId: r.skillId, label: r.label, dueDate: r.dueDate, ease: r.ease, lapses: r.lapses }))
    .filter((r) => langOfSkill(r.skillId) === db.lang && r.skillId in SKILL_BY_ID);
  const before = (await loadStudyDates(db)).filter((d) => d < today);
  const daily = await db.select({ week: schema.generatedLessons.weekNumber, n: sql<number>`count(*)` }).from(schema.generatedLessons)
    .where(and(eq(schema.generatedLessons.kind, "daily"), sql`${schema.generatedLessons.lessonDate} < ${today}`))
    .groupBy(schema.generatedLessons.weekNumber).all();
  const progress = await loadProgress(db);
  return {
    today,
    lang: db.lang,
    progress,
    focus: await loadFocusPattern(db, today, progress),
    dueItems,
    recentMistakes: await loadRecentMistakes(db, today),
    lastStudyDate: before[before.length - 1] ?? null,
    dailyLessonsByWeek: Object.fromEntries(daily.map((d) => [d.week, Number(d.n)])),
  };
}

/** Item keys from the most recent lessons, to avoid exact repeats. */
export async function recentItemKeys(db: DB, lessons = 4): Promise<string[]> {
  const ids = (await db.select({ id: schema.generatedLessons.id }).from(schema.generatedLessons)
    .orderBy(desc(schema.generatedLessons.createdAt)).limit(lessons).all()).map((r) => r.id);
  if (!ids.length) return [];
  return (await db.select({ k: schema.exercises.itemKey }).from(schema.exercises).where(inArray(schema.exercises.lessonId, ids)).all()).map((r) => r.k);
}
