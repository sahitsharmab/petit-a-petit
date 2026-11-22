import { addDays, daysBetween } from "./dates";

export interface StreakInfo {
  /** Study days in the current chain. */
  current: number;
  best: number;
  studiedToday: boolean;
  /** True when one more missed day would end the streak. */
  atRisk: boolean;
}

/**
 * Gentle streaks: one missed day between study days does not break the
 * chain (it just isn't counted). Two consecutive missed days end it.
 * `dates` are unique Paris study dates (any order).
 */
export function computeStreak(dates: string[], today: string): StreakInfo {
  const sorted = [...new Set(dates)].filter((d) => d <= today).sort();
  if (!sorted.length) return { current: 0, best: 0, studiedToday: false, atRisk: false };

  // Best chain anywhere in history.
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetween(sorted[i - 1], sorted[i]) <= 2 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const last = sorted[sorted.length - 1];
  const gap = daysBetween(last, today);
  let current = 0;
  if (gap <= 2) {
    current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (daysBetween(sorted[i - 1], sorted[i]) <= 2) current++;
      else break;
    }
  }
  return {
    current,
    best: Math.max(best, current),
    studiedToday: last === today,
    atRisk: current > 0 && last === addDays(today, -2),
  };
}
