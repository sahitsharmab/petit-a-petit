import type { Verdict } from "@/lib/french/evaluate";
import { daysBetween, parisDate } from "./dates";

export type MasteryStatus = "new" | "learning" | "reviewing" | "mastered";

export interface MasteryState {
  attempts: number;
  correct: number;
  incorrect: number;
  mastery: number;
  consecutiveCorrect: number;
  lessonsAsPrimary: number;
  status: MasteryStatus;
}

export const EMPTY_MASTERY: MasteryState = {
  attempts: 0, correct: 0, incorrect: 0, mastery: 0, consecutiveCorrect: 0, lessonsAsPrimary: 0, status: "new",
};

/** A skill is "passed" (curriculum moves on) at this mastery… */
export const PASS_MASTERY = 0.7;
/** …after at least this many first-attempt answers… */
export const PASS_MIN_ATTEMPTS = 6;
/** A previously passed skill below this needs consolidation. */
export const STRUGGLE_MASTERY = 0.45;

/** Credit (0–1) for a first attempt. Hints cap the credit. */
export function creditFor(verdict: Verdict, hintsUsed: number): number {
  const base = verdict === "correct" ? 1 : verdict === "almost" ? 0.6 : 0;
  return hintsUsed > 0 ? Math.min(base, 0.7) : base;
}

export function computeStatus(s: Pick<MasteryState, "attempts" | "mastery">): MasteryStatus {
  if (s.attempts === 0) return "new";
  if (s.mastery >= 0.85 && s.attempts >= 8) return "mastered";
  if (s.mastery >= 0.6) return "reviewing";
  return "learning";
}

/**
 * Exponential moving average towards the latest credit. Early answers move
 * the score faster so a new learner sees progress quickly.
 */
export function updateMastery(state: MasteryState, credit: number): MasteryState {
  const alpha = state.attempts < 5 ? 0.3 : 0.15;
  const mastery = Math.min(1, Math.max(0, state.mastery + alpha * (credit - state.mastery)));
  const good = credit >= 0.6;
  const next = {
    ...state,
    attempts: state.attempts + 1,
    correct: state.correct + (good ? 1 : 0),
    incorrect: state.incorrect + (good ? 0 : 1),
    mastery: Math.round(mastery * 1000) / 1000,
    consecutiveCorrect: good ? state.consecutiveCorrect + 1 : 0,
  };
  return { ...next, status: computeStatus(next) };
}

/** Mastery adjusted for forgetting: decays slowly after a week without practice. */
export function effectiveMastery(mastery: number, lastPracticed: string | null | undefined, today: string): number {
  if (!lastPracticed) return mastery;
  // Timestamps are UTC ISO strings; compare Paris calendar days, like `today`.
  const day = lastPracticed.includes("T") ? parisDate(new Date(lastPracticed)) : lastPracticed.slice(0, 10);
  const days = daysBetween(day, today);
  if (days <= 7) return mastery;
  return mastery * Math.max(0.6, 1 - (days - 7) * 0.01);
}

export function isPassed(s: MasteryState): boolean {
  return s.attempts >= PASS_MIN_ATTEMPTS && s.mastery >= PASS_MASTERY && s.lessonsAsPrimary >= 1;
}
