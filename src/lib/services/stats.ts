import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { ORDERED_SKILLS, SKILLS, WEEKS, getSkill } from "@/lib/content/curriculum";
import { addDays, parisDate, startOfWeek } from "@/lib/learning/dates";
import { effectiveMastery } from "@/lib/learning/mastery";
import { frontierSkill, type LessonPlan } from "@/lib/learning/planner";
import { computeStreak, type StreakInfo } from "@/lib/learning/streak";
import { getDailyLesson, previewToday, type LessonRecord } from "./lessons";
import type { PlayerState } from "./sessions";
import { loadProgress, loadRecentMistakes, loadStudyDates } from "./progress";

export const MISTAKE_LABELS: Record<string, string> = {
  "wrong-person": "Verb ending doesn't match the subject",
  auxiliary: "Avoir vs être in the passé composé",
  agreement: "Agreement (participles & adjectives)",
  accents: "Accents",
  elision: "Elision (j', n', l', qu')",
  negation: "Negation (ne … pas)",
  tense: "Choosing the right tense",
};

export function mistakeLabel(tag: string): string {
  if (MISTAKE_LABELS[tag]) return MISTAKE_LABELS[tag];
  try {
    return getSkill(tag).title;
  } catch {
    return tag;
  }
}

export async function getSettings(db: DB) {
  return (await db.select().from(schema.learningSettings).where(eq(schema.learningSettings.id, 1)).get())!;
}

/** Rough CEFR position from curriculum progress. */
export function levelLabel(frontierId: string): { cefr: string; label: string } {
  const s = getSkill(frontierId);
  if (s.week <= 4) return { cefr: "A1", label: "A1 · Foundations" };
  if (s.week <= 6) return { cefr: "A1+", label: "A1+ · Building up" };
  if (s.week <= 10) return { cefr: "A2", label: "A2 · Elementary" };
  return { cefr: "A2+", label: "A2+ · Towards B1" };
}

interface MinutesByDate { date: string; seconds: number; sessions: number }

export async function activityByDate(db: DB, from: string, to: string): Promise<Map<string, MinutesByDate>> {
  const map = new Map<string, MinutesByDate>();
  const lessons = await db.select({ date: schema.lessonSessions.studyDate, secs: sql<number>`sum(${schema.lessonSessions.activeSeconds})`, n: sql<number>`sum(case when ${schema.lessonSessions.status} = 'completed' then 1 else 0 end)` })
    .from(schema.lessonSessions).where(and(gte(schema.lessonSessions.studyDate, from), lte(schema.lessonSessions.studyDate, to)))
    .groupBy(schema.lessonSessions.studyDate).all();
  const convos = await db.select({ date: schema.conversationSessions.studyDate, secs: sql<number>`sum(${schema.conversationSessions.activeSeconds})`, n: sql<number>`sum(case when ${schema.conversationSessions.status} = 'completed' then 1 else 0 end)` })
    .from(schema.conversationSessions).where(and(gte(schema.conversationSessions.studyDate, from), lte(schema.conversationSessions.studyDate, to)))
    .groupBy(schema.conversationSessions.studyDate).all();
  for (const r of [...lessons, ...convos]) {
    const cur = map.get(r.date) ?? { date: r.date, seconds: 0, sessions: 0 };
    cur.seconds += Number(r.secs ?? 0);
    cur.sessions += Number(r.n ?? 0);
    map.set(r.date, cur);
  }
  return map;
}

export interface TodayCard {
  lesson: LessonRecord | null;
  plan: LessonPlan;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  sessionId: string | null;
  exerciseCount: number;
}

export async function todayCard(db: DB, now: Date): Promise<TodayCard> {
  const { lesson, plan } = await previewToday(db, now);
  if (!lesson) return { lesson: null, plan, status: "not_started", progress: 0, sessionId: null, exerciseCount: 0 };
  const sess = await db.select().from(schema.lessonSessions).where(eq(schema.lessonSessions.lessonId, lesson.id)).orderBy(desc(schema.lessonSessions.startedAt)).get();
  const count = (await db.select({ n: sql<number>`count(*)` }).from(schema.exercises).where(eq(schema.exercises.lessonId, lesson.id)).get())?.n ?? 0;
  if (!sess) return { lesson, plan, status: "not_started", progress: 0, sessionId: null, exerciseCount: Number(count) };
  const state = sess.state as PlayerState;
  const completedAny = await db.select({ id: schema.lessonSessions.id }).from(schema.lessonSessions)
    .where(and(eq(schema.lessonSessions.lessonId, lesson.id), eq(schema.lessonSessions.status, "completed"))).get();
  return {
    lesson, plan,
    status: completedAny ? "completed" : "in_progress",
    progress: sess.status === "completed" ? 1 : state.queue.length ? state.index / state.queue.length : 0,
    sessionId: sess.id,
    exerciseCount: Number(count),
  };
}

export async function getDashboard(db: DB, now: Date = new Date()) {
  const today = parisDate(now);
  const settings = await getSettings(db);
  const progress = await loadProgress(db);
  const frontier = frontierSkill({ progress });
  const dates = await loadStudyDates(db);
  const streak = computeStreak(dates, today);
  const card = await todayCard(db, now);

  const weekStart = startOfWeek(today);
  const act = await activityByDate(db, weekStart, addDays(weekStart, 6));
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const a = act.get(date);
    return { date, minutes: Math.round((a?.seconds ?? 0) / 60), sessions: a?.sessions ?? 0, isToday: date === today, isFuture: date > today };
  });

  const curriculum = ORDERED_SKILLS.filter((s) => s.category !== "review");
  const passed = curriculum.filter((s) => progress[s.id]?.passedAt).length;
  const mastered = SKILLS.filter((s) => (progress[s.id]?.mastery ?? 0) >= 0.85 && (progress[s.id]?.attempts ?? 0) >= 6).length;

  const practiced = SKILLS.filter((s) => (progress[s.id]?.attempts ?? 0) > 0 && s.category !== "review");
  const recentlyLearned = practiced
    .filter((s) => (progress[s.id]?.mastery ?? 0) >= 0.6)
    .sort((a, b) => ((progress[b.id]?.lastPracticedAt ?? "") > (progress[a.id]?.lastPracticedAt ?? "") ? 1 : -1))
    .slice(0, 4)
    .map((s) => ({ id: s.id, title: s.title, mastery: progress[s.id]!.mastery }));
  const dueBySkill = await db.select({ skillId: schema.reviewSchedule.skillId, n: sql<number>`count(*)` }).from(schema.reviewSchedule)
    .where(lte(schema.reviewSchedule.dueDate, today)).groupBy(schema.reviewSchedule.skillId).all();
  const dueMap = new Map(dueBySkill.map((d) => [d.skillId, Number(d.n)]));
  const needsReview = practiced
    .map((s) => ({ id: s.id, title: s.title, mastery: effectiveMastery(progress[s.id]!.mastery, progress[s.id]!.lastPracticedAt, today), due: dueMap.get(s.id) ?? 0 }))
    .filter((s) => s.mastery < 0.7 || s.due > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 4);
  const dueCount = [...dueMap.values()].reduce((a, b) => a + b, 0);

  // Continue where you left off: latest unfinished session.
  const open = await db.select({ s: schema.lessonSessions, l: schema.generatedLessons }).from(schema.lessonSessions)
    .innerJoin(schema.generatedLessons, eq(schema.generatedLessons.id, schema.lessonSessions.lessonId))
    .where(eq(schema.lessonSessions.status, "in_progress")).orderBy(desc(schema.lessonSessions.updatedAt)).limit(1).get();
  const resume = open
    ? { lessonId: open.l.id, title: open.l.title, kind: open.l.kind, date: open.l.lessonDate,
        progress: (open.s.state as PlayerState).queue.length ? (open.s.state as PlayerState).index / (open.s.state as PlayerState).queue.length : 0 }
    : null;

  // Yesterday (or the last study day): what was learned, what was hard.
  const lastDay = [...dates].reverse().find((d) => d < today) ?? null;
  let lastSession: { date: string; lessons: string[]; struggled: string[]; accuracy: number | null } | null = null;
  if (lastDay) {
    const sessions = await db.select({ title: schema.generatedLessons.title, score: schema.lessonSessions.score }).from(schema.lessonSessions)
      .innerJoin(schema.generatedLessons, eq(schema.generatedLessons.id, schema.lessonSessions.lessonId))
      .where(and(eq(schema.lessonSessions.studyDate, lastDay), eq(schema.lessonSessions.status, "completed"))).all();
    const mistakes = (await loadRecentMistakes(db, today)).filter((m) => m.lastDate === lastDay).sort((a, b) => b.count - a.count);
    const scores = sessions.map((s) => s.score).filter((x): x is number => x !== null);
    lastSession = {
      date: lastDay,
      lessons: [...new Set(sessions.map((s) => s.title))],
      struggled: mistakes.slice(0, 3).map((m) => m.label),
      accuracy: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    };
  }

  return {
    today,
    name: settings.displayName,
    settings: { reminderEnabled: settings.reminderEnabled, reminderTime: settings.reminderTime, dailyGoalMinutes: settings.dailyGoalMinutes },
    level: levelLabel(frontier),
    frontier: { id: frontier, title: getSkill(frontier).title, week: getSkill(frontier).week },
    card,
    streak,
    week,
    curriculum: { passed, total: curriculum.length, pct: passed / curriculum.length },
    mastered,
    recentlyLearned,
    needsReview,
    dueCount,
    resume: resume && resume.lessonId !== card.lesson?.id ? resume : null,
    lastSession,
    hasHistory: dates.length > 0 || practiced.length > 0,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export async function getProgressData(db: DB, now: Date = new Date()) {
  const today = parisDate(now);
  const progress = await loadProgress(db);
  const dates = await loadStudyDates(db);
  const streak: StreakInfo = computeStreak(dates, today);

  const totals = (await db.select({
    n: sql<number>`sum(case when ${schema.lessonSessions.status} = 'completed' then 1 else 0 end)`,
    secs: sql<number>`coalesce(sum(${schema.lessonSessions.activeSeconds}), 0)`,
    lessons: sql<number>`count(distinct case when ${schema.lessonSessions.status} = 'completed' then ${schema.lessonSessions.lessonId} end)`,
  }).from(schema.lessonSessions).get())!;
  const convTotals = (await db.select({
    n: sql<number>`sum(case when ${schema.conversationSessions.status} = 'completed' then 1 else 0 end)`,
    secs: sql<number>`coalesce(sum(${schema.conversationSessions.activeSeconds}), 0)`,
  }).from(schema.conversationSessions).get())!;

  // Heatmap: last 26 weeks, Monday-aligned.
  const heatStart = addDays(startOfWeek(today), -25 * 7);
  const act = await activityByDate(db, heatStart, today);
  const heatmap = Array.from({ length: 26 * 7 }, (_, i) => {
    const date = addDays(heatStart, i);
    const a = act.get(date);
    return { date, minutes: Math.round((a?.seconds ?? 0) / 60), sessions: a?.sessions ?? 0, future: date > today };
  });

  const weekly = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(startOfWeek(today), -(11 - i) * 7);
    let secs = 0;
    let sessions = 0;
    for (let d = 0; d < 7; d++) {
      const a = act.get(addDays(start, d));
      secs += a?.seconds ?? 0;
      sessions += a?.sessions ?? 0;
    }
    return { week: start, minutes: Math.round(secs / 60), sessions };
  });

  const monthStart = addDays(today, -180);
  const monthAct = await activityByDate(db, monthStart, today);
  const months = new Map<string, number>();
  for (const [d, a] of monthAct) months.set(d.slice(0, 7), (months.get(d.slice(0, 7)) ?? 0) + a.seconds);
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const [y, m] = today.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
    const key = dt.toISOString().slice(0, 7);
    return { month: key, minutes: Math.round((months.get(key) ?? 0) / 60) };
  });

  const accuracyRows = (await db.select({
    date: schema.exerciseAttempts.studyDate,
    total: sql<number>`count(*)`,
    ok: sql<number>`sum(case when ${schema.exerciseAttempts.isCorrect} then 1 else 0 end)`,
  }).from(schema.exerciseAttempts).where(eq(schema.exerciseAttempts.isFirst, true))
    .groupBy(schema.exerciseAttempts.studyDate).orderBy(desc(schema.exerciseAttempts.studyDate)).limit(30).all()).reverse();
  const accuracy = accuracyRows.map((r) => ({ date: r.date, accuracy: Number(r.ok) / Number(r.total), answers: Number(r.total) }));

  const mistakeRows = await db.select({ tag: schema.exerciseAttempts.mistakeTag, n: sql<number>`count(*)` }).from(schema.exerciseAttempts)
    .where(and(isNotNull(schema.exerciseAttempts.mistakeTag), sql`${schema.exerciseAttempts.mistakeTag} != 'blank'`))
    .groupBy(schema.exerciseAttempts.mistakeTag).orderBy(desc(sql`count(*)`)).limit(6).all();
  const mistakes = mistakeRows.map((r) => ({ tag: r.tag!, label: mistakeLabel(r.tag!), count: Number(r.n) }));

  const troubleItems = (await db.select().from(schema.reviewSchedule)
    .where(and(sql`${schema.reviewSchedule.lapses} > 0`, sql`${schema.reviewSchedule.itemType} != 'skill'`))
    .orderBy(desc(schema.reviewSchedule.lapses), schema.reviewSchedule.ease).limit(6).all())
    .map((r) => ({ label: r.label, lapses: r.lapses, skill: getSkill(r.skillId).short, due: r.dueDate }));

  const reviewed = await db.select({ type: schema.reviewSchedule.itemType, n: sql<number>`count(*)` }).from(schema.reviewSchedule).groupBy(schema.reviewSchedule.itemType).all();
  const reviewedMap = Object.fromEntries(reviewed.map((r) => [r.type, Number(r.n)]));

  const skills = ORDERED_SKILLS.map((s) => {
    const p = progress[s.id];
    return {
      id: s.id, title: s.title, short: s.short, week: s.week, category: s.category,
      mastery: p ? effectiveMastery(p.mastery, p.lastPracticedAt, today) : 0,
      rawMastery: p?.mastery ?? 0, attempts: p?.attempts ?? 0, status: p?.status ?? "new", passed: !!p?.passedAt,
      accuracy: p && p.attempts ? p.correct / p.attempts : null,
    };
  });
  const weeks = WEEKS.map((w) => {
    const ws = skills.filter((s) => s.week === w.number && s.category !== "review");
    const all = skills.filter((s) => s.week === w.number);
    return { number: w.number, title: w.title, passed: ws.filter((s) => s.passed).length, total: ws.length || all.length, mastery: all.reduce((a, s) => a + s.mastery, 0) / all.length };
  });
  const curriculum = skills.filter((s) => s.category !== "review");

  const weakest = skills.filter((s) => s.attempts > 0 && s.category !== "review").sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  const recommendations = [
    ...weakest.filter((s) => s.mastery < 0.7).map((s) => ({ kind: "skill" as const, skillId: s.id, title: s.title, reason: `Mastery ${Math.round(s.mastery * 100)}% — a targeted practice session will help.` })),
    ...mistakes.slice(0, 2).filter((m) => MISTAKE_LABELS[m.tag]).map((m) => ({ kind: "tip" as const, skillId: null, title: m.label, reason: `${m.count} mistakes of this kind so far. ${tipFor(m.tag)}` })),
  ];

  return {
    today, streak,
    totals: {
      sessions: Number(totals.n ?? 0) + Number(convTotals.n ?? 0),
      minutes: Math.round((Number(totals.secs) + Number(convTotals.secs)) / 60),
      lessons: Number(totals.lessons ?? 0),
      conversations: Number(convTotals.n ?? 0),
      studyDays: dates.length,
      itemsReviewed: Object.entries(reviewedMap).filter(([k]) => k !== "skill").reduce((a, [, v]) => a + v, 0),
      phrasesReviewed: (reviewedMap.sent ?? 0) + (reviewedMap.mcq ?? 0) + (reviewedMap.dlg ?? 0),
      formsReviewed: (reviewedMap.conj ?? 0) + (reviewedMap.gtr ?? 0),
    },
    heatmap, weekly, monthly, accuracy, mistakes, troubleItems, skills, weeks,
    curriculum: { passed: curriculum.filter((s) => s.passed).length, total: curriculum.length },
    recommendations,
  };
}

function tipFor(tag: string): string {
  switch (tag) {
    case "wrong-person": return "Say the subject out loud with the verb — nous → -ons, vous → -ez, ils → -ent.";
    case "auxiliary": return "Movement & change-of-state verbs and all reflexives take être.";
    case "agreement": return "With être, add -e for feminine and -s for plural subjects.";
    case "accents": return "Accents change meaning (a / à, ou / où, parle / parlé).";
    case "elision": return "je, ne, le, la, de, que drop their vowel before a vowel sound.";
    case "negation": return "Two parts around the conjugated verb: ne … pas.";
    case "tense": return "Check the time marker: hier → passé composé, demain → futur proche.";
    default: return "";
  }
}

export type ProgressData = Awaited<ReturnType<typeof getProgressData>>;

export async function getHistory(db: DB) {
  const lessons = await db.select().from(schema.generatedLessons).orderBy(desc(schema.generatedLessons.createdAt)).limit(200).all();
  const sessions = await db.select().from(schema.lessonSessions).all();
  const byLesson = new Map<string, typeof sessions>();
  for (const s of sessions) byLesson.set(s.lessonId, [...(byLesson.get(s.lessonId) ?? []), s]);
  const items = lessons.map((l) => {
    const ss = byLesson.get(l.id) ?? [];
    const done = ss.filter((s) => s.status === "completed").sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));
    return {
      id: l.id, title: l.title, subtitle: l.subtitle, kind: l.kind, date: l.lessonDate, week: l.weekNumber, day: l.dayNumber, source: l.source,
      status: done.length ? "completed" : ss.length ? "in_progress" : "not_started",
      score: done[0]?.score ?? null, minutes: Math.round(ss.reduce((a, s) => a + s.activeSeconds, 0) / 60),
    };
  }).filter((l) => l.status !== "not_started" || l.kind === "daily");
  const conversations = await db.select().from(schema.conversationSessions).orderBy(desc(schema.conversationSessions.createdAt)).limit(100).all();
  return { lessons: items, conversations };
}

export async function getLessonHistory(db: DB, lessonId: string) {
  const lesson = await db.select().from(schema.generatedLessons).where(eq(schema.generatedLessons.id, lessonId)).get();
  if (!lesson) return null;
  const exercises = await db.select().from(schema.exercises).where(eq(schema.exercises.lessonId, lessonId)).orderBy(schema.exercises.position).all();
  const sessions = await db.select().from(schema.lessonSessions).where(eq(schema.lessonSessions.lessonId, lessonId)).orderBy(schema.lessonSessions.startedAt).all();
  const attempts = sessions.length
    ? await db.select().from(schema.exerciseAttempts).where(sql`${schema.exerciseAttempts.sessionId} in (${sql.join(sessions.map((s) => sql`${s.id}`), sql`, `)})`).orderBy(schema.exerciseAttempts.id).all()
    : [];
  return { lesson, exercises, sessions, attempts };
}

export { getDailyLesson };
