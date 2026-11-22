/**
 * Error patterns that span items (audit F08). The first pattern is « nous » verb endings:
 * missing nous parlons and then nous mangeons is one weakness, not two unrelated items.
 *
 * Policy:
 *  - The focus turns on when the pattern recurs: at least two missed first answers on nous
 *    forms within the window.
 *  - While on, the warm-up gets one missed form plus the same tense with a fresh verb.
 *  - It retires after two unaided correct first answers on different verbs since the last
 *    miss, at least one of them on a later day than that miss.
 * Everything is derived from the attempt log, so there is no extra state to keep in sync.
 */
import type { Verdict } from "@/lib/french/evaluate";
import { addDays, daysBetween } from "./dates";

export const PATTERN_WINDOW_DAYS = 14;

export interface PatternAttempt {
  id: number;
  itemKey: string;
  verdict: Verdict;
  hintsUsed: number;
  studyDate: string;
  isFirst: boolean;
}

export interface ConjRef {
  verb: string;
  tense: string;
  subject: string;
  negative: boolean;
}

export interface FocusPattern {
  id: "nous-endings";
  /** Item key of the most recently missed form. */
  missedKey: string;
  /** Same tense, a verb not yet missed in this pattern. Null when no fresh verb is available. */
  freshKey: string | null;
  missedVerbs: string[];
  /** Unaided correct answers on different verbs since the last miss (retires at 2 with a later day). */
  progress: number;
}

/** The conjugation an item drills, for plain conjugation keys and generated transformations. */
export function conjOf(itemKey: string): ConjRef | null {
  const parts = itemKey.split(":");
  const c = parts[0] === "conj" ? parts : parts[0] === "gtr" ? parts.slice(2) : null;
  if (!c || c[0] !== "conj" || c.length < 4) return null;
  return { verb: c[1], tense: c[2], subject: c[3], negative: c[4] === "neg" };
}

export const conjKey = (c: ConjRef) => `conj:${c.verb}:${c.tense}:${c.subject}${c.negative ? ":neg" : ""}`;

/**
 * Work out whether the « nous » focus is active.
 * `verbsByTense` lists verbs the learner has already studied, per tense (fresh-verb candidates).
 */
export function nousFocus(attempts: PatternAttempt[], today: string, verbsByTense: Record<string, string[]>): FocusPattern | null {
  const since = addDays(today, -PATTERN_WINDOW_DAYS);
  const nous = attempts
    .filter((a) => a.isFirst && a.studyDate >= since && a.studyDate <= today)
    .map((a) => ({ a, c: conjOf(a.itemKey) }))
    .filter((x): x is { a: PatternAttempt; c: ConjRef } => x.c?.subject === "nous")
    .sort((x, y) => x.a.id - y.a.id);
  const misses = nous.filter((x) => x.a.verdict === "incorrect");
  if (misses.length < 2) return null;

  const last = misses[misses.length - 1];
  const wins = nous.filter((x) => x.a.id > last.a.id && x.a.verdict === "correct" && x.a.hintsUsed === 0);
  const winVerbs = new Set(wins.map((x) => x.c.verb));
  const laterDay = wins.some((x) => x.a.studyDate > last.a.studyDate);
  if (winVerbs.size >= 2 && laterDay) return null;

  const missedVerbs = [...new Set(misses.map((x) => x.c.verb))];
  const seen = new Set(nous.map((x) => x.c.verb));
  const pool = (verbsByTense[last.c.tense] ?? []).filter((v) => !missedVerbs.includes(v));
  const unseen = pool.filter((v) => !seen.has(v));
  const candidates = unseen.length ? unseen : pool;
  // Rotate through candidates day by day so the fresh verb changes.
  const day = Math.abs(daysBetween("2000-01-01", today));
  const fresh = candidates.length ? candidates[day % candidates.length] : null;
  return {
    id: "nous-endings",
    missedKey: conjKey({ ...last.c }),
    freshKey: fresh ? conjKey({ verb: fresh, tense: last.c.tense, subject: "nous", negative: false }) : null,
    missedVerbs,
    progress: winVerbs.size,
  };
}
