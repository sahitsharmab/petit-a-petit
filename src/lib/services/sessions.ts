import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { getSkill } from "@/lib/content/curriculum";
import type { Exercise } from "@/lib/content/types";
import { evaluateAnswer, type Mark, type Verdict } from "@/lib/french/evaluate";
import { parisDate } from "@/lib/learning/dates";
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
}

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
  firstTryCorrect: number;
  accuracy: number;
  minutes: number;
  primarySkill: { id: string; title: string; before: number; after: number; status: string };
  skills: { id: string; title: string; correct: number; total: number }[];
  mistakes: { exerciseId: string; prompt: string; instruction: string; answer: string; correct: string; explanation: string; rule: string }[];
  learned: string[];
  nextStep: string;
}

export type AnswerJudge = (ex: Exercise, answer: string) => Promise<{ isCorrect: boolean; correctedAnswer: string; explanation: string; mistakeTag?: string } | null>;

function readSession(db: DB, id: string) {
  const row = db.select().from(schema.lessonSessions).where(eq(schema.lessonSessions.id, id)).get();
  if (!row) throw new HttpError(404, "Session not found");
  return { ...row, state: row.state as PlayerState };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Resume the latest session for a lesson, or start one. */
export function getOrStartSession(db: DB, lessonId: string, now: Date = new Date()) {
  const lesson = getLesson(db, lessonId);
  if (!lesson) throw new HttpError(404, "Lesson not found");
  const existing = latestSessionForLesson(db, lessonId);
  if (existing) return { ...existing, state: existing.state as PlayerState };
  const exercises = getLessonExercises(db, lessonId);
  const progress = loadProgress(db);
  const state: PlayerState = {
    phase: lesson.intro.showExplanation || lesson.intro.rationale.length ? "intro" : "exercise",
    queue: exercises.map((e) => e.id),
    index: 0,
    results: {},
    retryFrom: null,
    masteryBefore: progress[lesson.primarySkillId]?.mastery ?? 0,
  };
  const id = `S-${randomUUID().slice(0, 13)}`;
  db.insert(schema.lessonSessions).values({ id, lessonId, status: "in_progress", state, studyDate: parisDate(now) }).run();
  return readSession(db, id);
}

/** Start a fresh attempt at a lesson that was already completed. */
export function restartSession(db: DB, lessonId: string, now: Date = new Date()) {
  const exercises = getLessonExercises(db, lessonId);
  if (!exercises.length) throw new HttpError(404, "Lesson not found");
  const lesson = getLesson(db, lessonId)!;
  const state: PlayerState = {
    phase: "exercise", queue: exercises.map((e) => e.id), index: 0, results: {}, retryFrom: null,
    masteryBefore: loadProgress(db)[lesson.primarySkillId]?.mastery ?? 0,
  };
  const id = `S-${randomUUID().slice(0, 13)}`;
  db.insert(schema.lessonSessions).values({ id, lessonId, status: "in_progress", state, studyDate: parisDate(now) }).run();
  return readSession(db, id);
}

function writeState(db: DB, id: string, state: PlayerState, extra: Partial<typeof schema.lessonSessions.$inferInsert> = {}) {
  db.update(schema.lessonSessions).set({ state, updatedAt: new Date().toISOString(), ...extra }).where(eq(schema.lessonSessions.id, id)).run();
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
export function saveProgress(db: DB, sessionId: string, patch: { phase?: PlayerState["phase"]; index?: number; activeSecondsDelta?: number }) {
  const s = readSession(db, sessionId);
  if (s.status === "completed") return s;
  const state = { ...s.state };
  if (patch.phase && patch.phase !== "summary") state.phase = patch.phase;
  // Navigation may revisit answered exercises but never jump past an unanswered one.
  if (typeof patch.index === "number" && patch.index >= 0 && patch.index <= firstUnfinished(state)) state.index = patch.index;
  const delta = Math.max(0, Math.min(MAX_ACTIVE_DELTA, Math.round(patch.activeSecondsDelta ?? 0)));
  writeState(db, sessionId, state, { activeSeconds: s.activeSeconds + delta });
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
  attemptNo?: number,
): Promise<{ feedback: Feedback; state: PlayerState }> {
  const s = readSession(db, sessionId);
  if (s.status === "completed" || s.state.phase === "summary") throw new HttpError(409, "This lesson is already completed.");
  const row = db.select().from(schema.exercises).where(and(eq(schema.exercises.id, exerciseId), eq(schema.exercises.lessonId, s.lessonId))).get();
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

  const recorded = db.transaction((tx) => {
    const t = tx as unknown as DB;
    // The AI judge is awaited above, so re-check that no other request changed this exercise meanwhile.
    const cur = readSession(t, sessionId);
    const curPrev = cur.state.results[resultKey];
    if (cur.status === "completed" || cur.state.index !== state.index || (curPrev?.attempts ?? 0) !== prev.attempts) return false;
    const fresh = cur.state;
    t.insert(schema.exerciseAttempts).values({
      sessionId, exerciseId, skillId: ex.skillId, itemKey: ex.itemKey, exerciseType: ex.type, answer: isChoice ? (ex.options?.[Number(answer)] ?? answer) : answer,
      expected: feedback.correctAnswer, verdict: feedback.verdict, isCorrect: feedback.verdict !== "incorrect", isFirst,
      mistakeTag: feedback.verdict === "incorrect" ? feedback.mistakeTag ?? null : feedback.verdict === "almost" ? feedback.mistakeTag ?? null : null,
      note: feedback.note ?? null, hintsUsed, judgedBy: feedback.judgedBy, studyDate: today,
    }).run();
    if (isFirst) applyFirstAttempt(t, ex, feedback.verdict, hintsUsed, today, now.toISOString());

    const result: ExerciseResult = {
      attempts, hintsUsed: Math.max(prev.hintsUsed, hintsUsed),
      firstVerdict: prev.firstVerdict ?? feedback.verdict, verdict: feedback.verdict, done, lastAnswer: answer, feedback,
    };
    fresh.results[resultKey] = result;
    fresh.phase = "exercise";
    writeState(t, sessionId, fresh);
    return true;
  });
  const latest = readSession(db, sessionId).state;
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
export function advance(db: DB, sessionId: string, fromIndex?: number) {
  const s = readSession(db, sessionId);
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
  writeState(db, sessionId, state);
  return state;
}

/**
 * Finish a session. Safe to retry: a completed session returns its saved summary unchanged.
 * Every queued exercise (including the retry round) must be answered first, and the skill
 * updates, primary-lesson credit and the completed status are written in one transaction.
 */
export function completeSession(db: DB, sessionId: string, now: Date = new Date()): SessionSummary {
  return db.transaction((tx) => completeInTx(tx as unknown as DB, sessionId, now));
}

function completeInTx(db: DB, sessionId: string, now: Date): SessionSummary {
  const s = readSession(db, sessionId);
  if (s.status === "completed" && s.summary) return s.summary as SessionSummary;
  const state = s.state;
  if (state.index < state.queue.length || firstUnfinished(state) < state.queue.length) {
    throw new HttpError(409, "Finish every exercise before completing the lesson.");
  }
  const lesson = getLesson(db, s.lessonId)!;
  const exercises = getLessonExercises(db, s.lessonId);
  const today = parisDate(now);
  const scored = exercises.filter((e) => state.results[e.id]?.firstVerdict);
  const firstOk = scored.filter((e) => state.results[e.id].firstVerdict !== "incorrect").length;

  const bySkill = new Map<string, { correct: number; total: number }>();
  for (const e of scored) {
    const cur = bySkill.get(e.skillId) ?? { correct: 0, total: 0 };
    cur.total++;
    if (state.results[e.id].firstVerdict !== "incorrect") cur.correct++;
    bySkill.set(e.skillId, cur);
  }

  for (const [sid, v] of bySkill) applySkillReview(db, sid, v.correct / v.total, today);
  if (lesson.kind === "daily" || lesson.kind === "practice") incrementPrimary(db, lesson.primarySkillId, now.toISOString());

  const after = loadProgress(db)[lesson.primarySkillId];
  const mistakes = scored.filter((e) => state.results[e.id].firstVerdict === "incorrect").map((e) => {
    const r = state.results[e.id];
    return {
      exerciseId: e.id, prompt: e.prompt, instruction: e.instruction,
      answer: e.options && r.lastAnswer !== undefined && /^\d+$/.test(r.lastAnswer) ? e.options[Number(r.lastAnswer)] ?? r.lastAnswer : r.lastAnswer ?? "",
      correct: r.feedback?.correctAnswer ?? e.accepted[0], explanation: r.feedback?.note ?? e.explanation, rule: e.rule,
    };
  });
  const accuracy = scored.length ? firstOk / scored.length : 0;
  const primary = getSkill(lesson.primarySkillId);
  const summary: SessionSummary = {
    total: scored.length,
    firstTryCorrect: firstOk,
    accuracy,
    minutes: Math.max(1, Math.round(s.activeSeconds / 60)),
    primarySkill: { id: primary.id, title: primary.title, before: state.masteryBefore, after: after?.mastery ?? 0, status: after?.status ?? "new" },
    skills: [...bySkill.entries()].map(([id, v]) => ({ id, title: getSkill(id).title, ...v })),
    mistakes,
    learned: primary.objectives,
    nextStep: accuracy >= 0.8
      ? "Great work — you're ready to keep moving forward."
      : accuracy >= 0.6
        ? "Solid session. The items you missed will come back in tomorrow's warm-up."
        : "This one is still settling in. Tomorrow will include extra practice on it — that's how it sticks.",
  };
  state.phase = "summary";
  writeState(db, sessionId, state, { status: "completed", completedAt: now.toISOString(), score: accuracy, summary });
  return summary;
}

export function getSession(db: DB, id: string) {
  return readSession(db, id);
}
