import type { Verdict } from "@/lib/french/evaluate";
import { addDays } from "./dates";

export interface ReviewState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueDate: string;
  lastReviewedDate: string | null;
}

export const MAX_INTERVAL_DAYS = 60;

/** SM-2 style quality (0–5) of a first attempt. */
export function qualityFor(verdict: Verdict, hintsUsed: number): number {
  if (verdict === "incorrect") return 1;
  if (verdict === "almost") return 3;
  return hintsUsed > 0 ? 4 : 5;
}

/**
 * Lightweight SM-2: failures come back tomorrow, successes space out
 * 1 → 3 → interval × ease days, capped at 60. Only the first review of an
 * item per day changes its schedule (retries within a lesson don't inflate it).
 */
export function scheduleReview(prev: ReviewState | undefined, quality: number, today: string): ReviewState {
  const base: ReviewState = prev ?? { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, dueDate: today, lastReviewedDate: null };
  if (base.lastReviewedDate === today && prev) return base;

  const ease = Math.max(1.3, Math.round((base.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))) * 100) / 100);
  if (quality < 3) {
    return { ease, intervalDays: 1, reps: 0, lapses: base.lapses + 1, dueDate: addDays(today, 1), lastReviewedDate: today };
  }
  const reps = base.reps + 1;
  let interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(base.intervalDays * ease);
  if (quality === 3) interval = Math.max(1, Math.round(interval * 0.6));
  interval = Math.min(MAX_INTERVAL_DAYS, Math.max(1, interval));
  return { ease, intervalDays: interval, reps, lapses: base.lapses, dueDate: addDays(today, interval), lastReviewedDate: today };
}

/** Skill-level quality from a lesson's first-attempt accuracy on that skill. */
export function qualityFromAccuracy(accuracy: number): number {
  if (accuracy >= 0.9) return 5;
  if (accuracy >= 0.75) return 4;
  if (accuracy >= 0.6) return 3;
  if (accuracy >= 0.4) return 2;
  return 1;
}
