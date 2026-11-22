import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { getSkill } from "@/lib/content/curriculum";
import type { Exercise } from "@/lib/content/types";
import { evaluateAnswer, type Mark, type Verdict } from "@/lib/french/evaluate";
import { parisDate } from "@/lib/learning/dates";
import { HttpError } from "@/lib/http-error";
import { applyFirstAttempt, applySkillReview, incrementPrimary, loadProgress } from "./progress";
import { getLesson, getLessonExercises, latestSessionForLesson } from "./lessons";

export interface Feedback {
  verdict: Verdict;
  /** Correct answer to display (canonical). */
  correctAnswer: string;
  explanation: string;
  note?: string;
  rule: string;
  translation?: string;
  answerMarks?: Mark[];
  expectedMarks?: Mark[];
  /** Selected option index for choice exercises. */
  chosenIndex?: number;
  correctIndex?: number;
  canRetry: boolean;
  judgedBy: "local" | "ai";
  mistakeTag?: string;
}

export interface ExerciseResult {
  attempts: number;
  hintsUsed: number;
  firstVerdict: Verdict | null;
  verdict: Verdict | null;
  done: boolean;
  lastAnswer?: string;
  feedback?: Feedback;
  /** Listening: the transcript was visible when answering (supported, not unaided, listening). */
  transcriptShown?: boolean;
}

/** How a first answer went; the headline score counts only "exact". */
export type Outcome = "exact" | "almost" | "hinted" | "supported" | "recovered" | "missed";

export interface PlayerState {
  phase: "intro" | "exercise" | "summary";
  /** Exercise ids in play order; missed exercises are appended once as a retry round. */
  queue: string[];
  index: number;
  results: Record<string, ExerciseResult>;
  /** queue positions that are retries. */
  retryFrom: number | null;
  masteryBefore: number;
}

export interface SessionSummary {
  total: number;
  /** Exact, unaided first answers (the headline score). */
  firstTryCorrect: number;
  /** firstTryCorrect / total. */
  accuracy: number;
  /** Count of each first-answer outcome. Absent on summaries saved before this field existed. */
  breakdown?: Record<Outcome, number>;
  minutes: number;
  primarySkill: { id: string; title: string; before: number; after: number; status: string };
  skills: { id: string; title: string; correct: number; total: number }[];
  /**
   * Answers worth another look. `answer` is the learner's FIRST answer; for "recovered" items
   * `retryAnswer` is the corrected one they gave on the second try.
   */
  mistakes: {
    exerciseId: string; prompt: string; instruction: string; answer: string; correct: string; explanation: string; rule: string;
    kind?: "missed" | "recovered" | "almost"; retryAnswer?: string;
  }[];
  learned: string[];
  nextStep: string;
}

export type AnswerJudge = (ex: Exercise, answer: string) => Promise<{ isCorrect: boolean; correctedAnswer: string; explanation: string; mistakeTag?: string } | null>;

async function readSession(db: DB, id: string) {
  const row = await db.select().from(schema.lessonSessions).where(eq(schema.lessonSessions.id, id)).get();
  if (!row) throw new HttpError(404, "Session not found");
  return { ...row, state: row.state as PlayerState };
}

export { HttpError };

/** Resume the latest session for a lesson, or start one. */
export async function getOrStartSession(db: DB, lessonId: string, now: Date = new Date()) {
  const lesson = await getLesson(db, lessonId);
  if (!lesson) throw new HttpError(404, "Lesson not found");
  const existing = await latestSessionForLesson(db, lessonId);
  if (existing) return { ...existing, state: existing.state as PlayerState };
  const exercises = await getLessonExercises(db, lessonId);
  const progress = await loadProgress(db);
  const state: PlayerState = {
    phase: lesson.intro.showExplanation || lesson.intro.rationale.length ? "intro" : "exercise",
    queue: exercises.map((e) => e.id),
    index: 0,
    results: {},
    retryFrom: null,
    masteryBefore: progress[lesson.primarySkillId]?.mastery ?? 0,
  };
  const id = `S-${randomUUID().slice(0, 13)}`;
  await db.insert(schema.lessonSessions).values({ id, lessonId, status: "in_progress", state, studyDate: parisDate(now) }).run();
  return readSession(db, id);
}

/** Start a fresh attempt at a lesson that was already completed. */
export async function restartSession(db: DB, lessonId: string, now: Date = new Date()) {
  const exercises = await getLessonExercises(db, lessonId);
  if (!exercises.length) throw new HttpError(404, "Lesson not found");
  const lesson = (await getLesson(db, lessonId))!;
  const state: PlayerState = {
    phase: "exercise", queue: exercises.map((e) => e.id), index: 0, results: {}, retryFrom: null,
    masteryBefore: (await loadProgress(db))[lesson.primarySkillId]?.mastery ?? 0,
  };
  const id = `S-${randomUUID().slice(0, 13)}`;
  await db.insert(schema.lessonSessions).values({ id, lessonId, status: "in_progress", state, studyDate: parisDate(now) }).run();
  return readSession(db, id);
}

async function writeState(db: DB, id: string, state: PlayerState, extra: Partial<typeof schema.lessonSessions.$inferInsert> = {}) {
  await db.update(schema.lessonSessions).set({ state, updatedAt: new Date().toISOString(), ...extra }).where(eq(schema.lessonSessions.id, id)).run();
}

/** Result key for a queue position (retry-round positions get a "#retry" suffix). */
function resultKeyAt(state: PlayerState, pos: number): string {
  const id = state.queue[pos];
  return state.retryFrom !== null && pos >= state.retryFrom ? `${id}#retry` : id;
}

/** First queue position whose exercise is not finished (queue.length when all are). */
function firstUnfinished(state: PlayerState): number {
  for (let pos = 0; pos < state.queue.length; pos++) if (!state.results[resultKeyAt(state, pos)]?.done) return pos;
  return state.queue.length;
}

const MAX_ACTIVE_DELTA = 120;

/** Persist navigation (phase / index) and active study time. */
export async function saveProgress(db: DB, sessionId: string, patch: { phase?: PlayerState["phase"]; index?: number; activeSecondsDelta?: number }) {
  const s = await readSession(db, sessionId);
  if (s.status === "completed") return s;
  const state = { ...s.state };
  if (patch.phase && patch.phase !== "summary") state.phase = patch.phase;
  // Navigation may revisit answered exercises but never jump past an unanswered one.
  if (typeof patch.index === "number" && patch.index >= 0 && patch.index <= firstUnfinished(state)) state.index = patch.index;
  const delta = Math.max(0, Math.min(MAX_ACTIVE_DELTA, Math.round(patch.activeSecondsDelta ?? 0)));
  await writeState(db, sessionId, state, { activeSeconds: s.activeSeconds + delta });
  return readSession(db, sessionId);
}

function evaluateChoice(ex: Exercise, answer: string) {
  const idx = Number(answer);
  const correct = idx === ex.answerIndex;
  return {
    verdict: (correct ? "correct" : "incorrect") as Verdict,
    chosenIndex: idx,
    correctIndex: ex.answerIndex,
    expected: ex.options?.[ex.answerIndex ?? 0] ?? ex.accepted[0],
    note: !correct ? ex.optionNotes?.[idx] : undefined,
  };
}

/**
 * Record an answer for the current exercise.
 *
 * Safe to retry: `attemptNo` (1 for the first try, 2 for the retry/reveal) identifies the
 * attempt, so a duplicate delivery returns the saved feedback instead of recording again.
 * Answers are only accepted for the exercise at the current queue position.
 */
export async function submitAttempt(
  db: DB, sessionId: string, exerciseId: string, rawAnswer: string, hintsUsed: number, now: Date = new Date(), judge?: AnswerJudge,
  attemptNo?: number, assist: { transcriptShown?: boolean } = {},
): Promise<{ feedback: Feedback; state: PlayerState }> {
  const s = await readSession(db, sessionId);
  if (s.status === "completed" || s.state.phase === "summary") throw new HttpError(409, "This lesson is already completed.");
  const row = await db.select().from(schema.exercises).where(and(eq(schema.exercises.id, exerciseId), eq(schema.exercises.lessonId, s.lessonId))).get();
  if (!row) throw new HttpError(404, "Exercise not in this lesson");
  const ex = row.payload as Exercise;
  const answer = String(rawAnswer ?? "").slice(0, 500);
  const state = s.state;
  if (state.queue[state.index] !== exerciseId) {
    throw new HttpError(409, "That exercise isn't the current one. Reload the lesson to continue where you left off.");
  }
  const inRetryRound = state.retryFrom !== null && state.index >= state.retryFrom;
  const resultKey = inRetryRound ? `${exerciseId}#retry` : exerciseId;
  const prev: ExerciseResult = state.results[resultKey] ?? { attempts: 0, hintsUsed: 0, firstVerdict: null, verdict: null, done: false };
  const isChoice = !!ex.options && ex.answerIndex !== undefined;

  // Duplicate deliveries resolve to the attempt already recorded.
  if (attemptNo !== undefined) {
    if (attemptNo === prev.attempts && prev.feedback) return { feedback: prev.feedback, state };
    if (attemptNo !== prev.attempts + 1) throw new HttpError(409, "This answer was already recorded. Reload the lesson to continue.");
  }
  if (prev.done) {
    if (prev.feedback && prev.lastAnswer === answer) return { feedback: prev.feedback, state };
    throw new HttpError(409, "This exercise is already answered.");
  }
  if (isChoice) {
    const n = Number(answer);
    if (!/^\d+$/.test(answer.trim()) || n >= (ex.options?.length ?? 0)) throw new HttpError(400, "Choose one of the options.");
  } else if (!answer.trim()) {
    throw new HttpError(400, "Type an answer first.");
  }

  let feedback: Feedback;
  if (isChoice) {
    const r = evaluateChoice(ex, answer);
    feedback = {
      verdict: r.verdict, correctAnswer: r.expected, explanation: ex.explanation, note: r.note, rule: ex.rule,
      translation: ex.translation, chosenIndex: r.chosenIndex, correctIndex: r.correctIndex, canRetry: false, judgedBy: "local",
      mistakeTag: r.verdict === "incorrect" ? ex.skillId : undefined,
    };
  } else {
    const r = evaluateAnswer({
      answer, accepted: ex.accepted, confusables: ex.confusables, defaultTag: ex.skillId,
      unchangedFrom: ex.type === "transformation" ? ex.prompt : undefined,
    });
    feedback = {
      verdict: r.verdict, correctAnswer: r.verdict === "incorrect" ? r.closest : r.closest, explanation: ex.explanation, note: r.note,
      rule: ex.rule, translation: ex.translation, answerMarks: r.answerMarks, expectedMarks: r.expectedMarks, canRetry: false,
      judgedBy: "local", mistakeTag: r.mistakeTag,
    };
    // Free-form answers the local checker rejects can be re-judged by AI (no confusable match).
    if (r.verdict === "incorrect" && ex.allowAiJudge && judge && !ex.confusables?.some((c) => c.text.toLowerCase() === answer.trim().toLowerCase())) {
      try {
        const j = await judge(ex, answer);
        if (j) {
          feedback = {
            ...feedback, verdict: j.isCorrect ? "correct" : "incorrect", correctAnswer: j.isCorrect ? answer : j.correctedAnswer || r.closest,
            note: j.explanation, judgedBy: "ai", mistakeTag: j.isCorrect ? undefined : j.mistakeTag ?? r.mistakeTag,
            answerMarks: j.isCorrect ? undefined : feedback.answerMarks, expectedMarks: j.isCorrect ? undefined : feedback.expectedMarks,
          };
        }
      } catch (err) {
        console.warn("[judge] AI evaluation failed, keeping local verdict:", (err as Error).message);
      }
    }
  }

  const attempts = prev.attempts + 1;
  const isFirst = prev.attempts === 0 && !inRetryRound;
  // One retry (with a hint) before the answer is revealed. Choice exercises reveal immediately.
  feedback.canRetry = feedback.verdict === "incorrect" && !isChoice && attempts < 2;
  const done = feedback.verdict !== "incorrect" || !feedback.canRetry;
  const today = parisDate(now);
  // A visible transcript makes listening supported practice: it gets the same reduced credit as a hint.
  const transcriptShown = ex.type === "listening" && (!!assist.transcriptShown || !!prev.transcriptShown);
  const assistedHints = hintsUsed + (transcriptShown ? 1 : 0);

  const recorded = await db.transaction(async (tx) => {
    const t = tx as unknown as DB;
    // The AI judge is awaited above, so re-check that no other request changed this exercise meanwhile.
    const cur = await readSession(t, sessionId);
    const curPrev = cur.state.results[resultKey];
    if (cur.status === "completed" || cur.state.index !== state.index || (curPrev?.attempts ?? 0) !== prev.attempts) return false;
    const fresh = cur.state;
    await t.insert(schema.exerciseAttempts).values({
      sessionId, exerciseId, skillId: ex.skillId, itemKey: ex.itemKey, exerciseType: ex.type, answer: isChoice ? (ex.options?.[Number(answer)] ?? answer) : answer,
      expected: feedback.correctAnswer, verdict: feedback.verdict, isCorrect: feedback.verdict !== "incorrect", isFirst,
      mistakeTag: feedback.verdict === "incorrect" ? feedback.mistakeTag ?? null : feedback.verdict === "almost" ? feedback.mistakeTag ?? null : null,
      note: feedback.note ?? null, hintsUsed: assistedHints, judgedBy: feedback.judgedBy, studyDate: today,
    }).run();
    if (isFirst) await applyFirstAttempt(t, ex, feedback.verdict, assistedHints, today, now.toISOString());

    const result: ExerciseResult = {
      attempts, hintsUsed: Math.max(prev.hintsUsed, hintsUsed),
      firstVerdict: prev.firstVerdict ?? feedback.verdict, verdict: feedback.verdict, done, lastAnswer: answer, feedback,
      ...(transcriptShown ? { transcriptShown: true } : {}),
    };
    fresh.results[resultKey] = result;
    fresh.phase = "exercise";
    await writeState(t, sessionId, fresh);
    return true;
  }); // libSQL transactions take the write lock up front (BEGIN IMMEDIATE).
  const latest = (await readSession(db, sessionId)).state;
  if (!recorded) {
    const saved = latest.results[resultKey]?.feedback;
    if (saved) return { feedback: saved, state: latest };
    throw new HttpError(409, "This lesson changed in another tab. Reload to continue.");
  }
  return { feedback, state: latest };
}

/**
 * Move to the next exercise; appends a retry round for missed items when the main queue ends.
 * `fromIndex` is the position the caller is leaving: a repeated request for a position the
 * session has already left is a no-op, so double clicks or retried requests never skip a question.
 */
export async function advance(db: DB, sessionId: string, fromIndex?: number) {
  const s = await readSession(db, sessionId);
  const state = s.state;
  if (s.status === "completed" || state.phase === "summary") return state;
  if (fromIndex !== undefined && fromIndex !== state.index) return state;
  if (state.index >= state.queue.length) return state;
  if (!state.results[resultKeyAt(state, state.index)]?.done) throw new HttpError(409, "Answer this exercise before moving on.");
  const next = state.index + 1;
  if (next >= state.queue.length && state.retryFrom === null) {
    const missed = state.queue.filter((id) => state.results[id]?.firstVerdict === "incorrect");
    if (missed.length) {
      state.retryFrom = state.queue.length;
      state.queue = [...state.queue, ...missed];
      for (const id of missed) state.results[`${id}#retry`] = { attempts: 0, hintsUsed: 0, firstVerdict: null, verdict: null, done: false };
    }
  }
  state.index = Math.min(next, state.queue.length);
  await writeState(db, sessionId, state);
  return state;
}

/** Session-level credit per outcome, matching the mastery model (near miss 0.6, assisted 0.7). */
const OUTCOME_CREDIT: Record<Outcome, number> = { exact: 1, hinted: 0.7, supported: 0.7, almost: 0.6, recovered: 0, missed: 0 };

/** Classify a first answer; `retry` is the retry-round result, `firstHints` the first attempt's hints. */
export function outcomeOf(r: ExerciseResult, retry: ExerciseResult | undefined, firstHints: number | undefined): Outcome {
  if (r.firstVerdict === "incorrect") {
    const fixedInQuestion = r.attempts >= 2 && r.verdict !== "incorrect";
    const fixedInRetryRound = !!retry?.firstVerdict && retry.firstVerdict !== "incorrect";
    return fixedInQuestion || fixedInRetryRound ? "recovered" : "missed";
  }
  if (r.transcriptShown) return "supported";
  if (r.firstVerdict === "almost") return "almost";
  if ((firstHints ?? r.hintsUsed) > 0) return "hinted";
  return "exact";
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Next-step text from what actually happened and what the planner will do (passed skills move on). */
function nextStepText(b: Record<Outcome, number>, primaryPassed: boolean): string {
  const parts: string[] = [];
  if (b.missed) parts.push(`You missed ${plural(b.missed, "answer", "answers")}. ${b.missed === 1 ? "It's" : "They're"} scheduled for review.`);
  if (b.recovered) parts.push(`You fixed ${plural(b.recovered, "answer", "answers")} on a second try. ${b.recovered === 1 ? "It comes" : "They come"} back once more so ${b.recovered === 1 ? "it sticks" : "they stick"}.`);
  const assisted = b.almost + b.hinted + b.supported;
  if (assisted) parts.push(`${plural(assisted, "answer was", "answers were")} nearly right or needed help. Try ${assisted === 1 ? "it" : "them"} unaided next time.`);
  if (!parts.length) parts.push("Every answer was exact and unaided.");
  parts.push(primaryPassed ? "This topic is passed, so new material comes next." : "This topic needs a bit more practice before new material.");
  return parts.join(" ");
}

/**
 * Finish a session. Safe to retry: a completed session returns its saved summary unchanged.
 * Every queued exercise (including the retry round) must be answered first, and the skill
 * updates, primary-lesson credit and the completed status are written in one transaction.
 */
export async function completeSession(db: DB, sessionId: string, now: Date = new Date()): Promise<SessionSummary> {
  return db.transaction((tx) => completeInTx(tx as unknown as DB, sessionId, now));
}

async function completeInTx(db: DB, sessionId: string, now: Date): Promise<SessionSummary> {
  const s = await readSession(db, sessionId);
  if (s.status === "completed" && s.summary) return s.summary as SessionSummary;
  const state = s.state;
  if (state.index < state.queue.length || firstUnfinished(state) < state.queue.length) {
    throw new HttpError(409, "Finish every exercise before completing the lesson.");
  }
  const lesson = (await getLesson(db, s.lessonId))!;
  const exercises = await getLessonExercises(db, s.lessonId);
  const today = parisDate(now);
  const scored = exercises.filter((e) => state.results[e.id]?.firstVerdict);

  // The learner's actual first answer (and its hints) for each exercise, from the attempt log.
  const firstRows = new Map<string, { answer: string; hintsUsed: number }>();
  for (const a of await db.select().from(schema.exerciseAttempts).where(eq(schema.exerciseAttempts.sessionId, sessionId)).orderBy(asc(schema.exerciseAttempts.id)).all()) {
    if (!firstRows.has(a.exerciseId)) firstRows.set(a.exerciseId, { answer: a.answer, hintsUsed: a.hintsUsed });
  }
  const outcome = (e: Exercise): Outcome => outcomeOf(state.results[e.id], state.results[`${e.id}#retry`], firstRows.get(e.id)?.hintsUsed);
  const outcomes = new Map(scored.map((e) => [e.id, outcome(e)]));
  const breakdown: Record<Outcome, number> = { exact: 0, almost: 0, hinted: 0, supported: 0, recovered: 0, missed: 0 };
  for (const o of outcomes.values()) breakdown[o]++;

  // Skill review keeps partial credit for near misses and assisted answers.
  const bySkill = new Map<string, { correct: number; total: number; credit: number }>();
  for (const e of scored) {
    const cur = bySkill.get(e.skillId) ?? { correct: 0, total: 0, credit: 0 };
    cur.total++;
    cur.credit += OUTCOME_CREDIT[outcomes.get(e.id)!];
    if (outcomes.get(e.id) === "exact") cur.correct++;
    bySkill.set(e.skillId, cur);
  }

  for (const [sid, v] of bySkill) await applySkillReview(db, sid, v.credit / v.total, today);
  if (lesson.kind === "daily" || lesson.kind === "practice") await incrementPrimary(db, lesson.primarySkillId, now.toISOString());

  const after = (await loadProgress(db))[lesson.primarySkillId];
  const shown = (e: Exercise, value: string | undefined) => e.options && value !== undefined && /^\d+$/.test(value) ? e.options[Number(value)] ?? value : value ?? "";
  const mistakes: SessionSummary["mistakes"] = scored.flatMap((e) => {
    const kind = outcomes.get(e.id)!;
    if (kind !== "missed" && kind !== "recovered" && kind !== "almost") return [];
    const r = state.results[e.id];
    const retry = state.results[`${e.id}#retry`];
    const first = firstRows.get(e.id)?.answer ?? shown(e, r.lastAnswer);
    const retryAnswer = kind === "recovered" ? (r.verdict !== "incorrect" ? shown(e, r.lastAnswer) : shown(e, retry?.lastAnswer)) : undefined;
    return [{
      exerciseId: e.id, prompt: e.prompt, instruction: e.instruction, kind, answer: first, retryAnswer,
      correct: r.feedback?.correctAnswer ?? e.accepted[0], explanation: r.feedback?.note ?? e.explanation, rule: e.rule,
    }];
  });
  const accuracy = scored.length ? breakdown.exact / scored.length : 0;
  const primary = getSkill(lesson.primarySkillId);
  const summary: SessionSummary = {
    total: scored.length,
    firstTryCorrect: breakdown.exact,
    accuracy,
    breakdown,
    minutes: Math.max(1, Math.round(s.activeSeconds / 60)),
    primarySkill: { id: primary.id, title: primary.title, before: state.masteryBefore, after: after?.mastery ?? 0, status: after?.status ?? "new" },
    skills: [...bySkill.entries()].map(([id, v]) => ({ id, title: getSkill(id).title, correct: v.correct, total: v.total })),
    mistakes,
    learned: primary.objectives,
    nextStep: nextStepText(breakdown, !!after?.passedAt),
  };
  state.phase = "summary";
  // The lesson keeps its assigned date; the study (streak, activity) counts on the Paris day it was completed.
  await writeState(db, sessionId, state, { status: "completed", completedAt: now.toISOString(), score: accuracy, summary, studyDate: today });
  return summary;
}

export async function getSession(db: DB, id: string) {
  return readSession(db, id);
}
