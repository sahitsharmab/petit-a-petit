import { getSkill, orderedSkills } from "@/lib/content/curriculum";
import { baseSkillId, skillIdFor, type Lang } from "@/lib/content/languages";
import { daysBetween } from "./dates";
import { EMPTY_MASTERY, PASS_MASTERY, STRUGGLE_MASTERY, effectiveMastery, isPassed, type MasteryState } from "./mastery";
import { conjOf, type FocusPattern } from "./patterns";

export type LessonMode = "new" | "continue" | "consolidate" | "welcome-back" | "review";

export interface SkillProgress extends MasteryState {
  lastPracticedAt?: string | null;
  passedAt?: string | null;
}

export interface ReviewCandidate {
  itemKey: string;
  skillId: string;
  label: string;
  dueDate: string;
  ease: number;
  lapses: number;
}

export interface RecentMistake {
  itemKey: string;
  skillId: string;
  label: string;
  /** Wrong first attempts in the window. */
  count: number;
  lastDate: string;
}

export interface PlannerInput {
  today: string;
  /** The learner's course (default French). */
  lang?: Lang;
  progress: Record<string, SkillProgress>;
  /** Review items with dueDate <= today. */
  dueItems: ReviewCandidate[];
  /** Items answered wrongly recently and not yet answered correctly since. */
  recentMistakes: RecentMistake[];
  /** Most recent Paris date with completed study activity, before today. */
  lastStudyDate?: string | null;
  /** Number of earlier daily lessons per curriculum week. */
  dailyLessonsByWeek: Record<number, number>;
  /** An active cross-item error pattern (e.g. « nous » endings) to target in the warm-up. */
  focus?: FocusPattern | null;
}

export interface LessonPlan {
  primarySkillId: string;
  mode: LessonMode;
  templateId: string;
  /** Item keys for the warm-up; "skill:<id>" means any exercise of that skill. */
  reviewKeys: string[];
  reviewSkillIds: string[];
  weekNumber: number;
  dayNumber: number;
  title: string;
  subtitle: string;
  rationale: string[];
}

const progressOf = (input: PlannerInput, id: string): SkillProgress => input.progress[id] ?? EMPTY_MASTERY;

/** The first skill in curriculum order that hasn't been passed yet. */
export function frontierSkill(input: Pick<PlannerInput, "progress" | "lang">): string {
  for (const s of orderedSkills(input.lang)) {
    const p = input.progress[s.id];
    if (!p?.passedAt && !isPassed(p ?? EMPTY_MASTERY)) return s.id;
  }
  return skillIdFor(input.lang ?? "fr", "w12-review");
}

/** Passed skills that have slipped badly — they need an extra practice day. */
export function strugglingSkills(input: PlannerInput, beforeSkill: string): string[] {
  const out: string[] = [];
  for (const s of orderedSkills(input.lang)) {
    if (s.id === beforeSkill) break;
    const p = progressOf(input, s.id);
    if (p.attempts < 6 || s.category === "review") continue;
    const eff = effectiveMastery(p.mastery, p.lastPracticedAt, input.today);
    const recentFails = input.recentMistakes.filter((m) => m.skillId === s.id).reduce((a, m) => a + m.count, 0);
    if (eff < STRUGGLE_MASTERY && recentFails >= 2) out.push(s.id);
  }
  return out;
}

/** Choose warm-up review items: yesterday's mistakes first, then due items, then weakest skills. */
export function chooseReviewKeys(input: PlannerInput, primary: string, count: number): string[] {
  if (count <= 0) return [];
  const keys: string[] = [];
  const skillsUsed = new Map<string, number>();
  const add = (key: string, skillId: string) => {
    if (keys.includes(key) || keys.length >= count) return;
    if ((skillsUsed.get(skillId) ?? 0) >= 2) return; // keep variety
    keys.push(key);
    skillsUsed.set(skillId, (skillsUsed.get(skillId) ?? 0) + 1);
  };
  // An active error pattern comes first: one missed form plus a fresh verb with the same ending.
  // These two don't count toward the per-skill variety cap.
  if (input.focus) {
    for (const k of [input.focus.missedKey, input.focus.freshKey]) if (k && !keys.includes(k) && keys.length < count) keys.push(k);
  }
  const mistakes = [...input.recentMistakes].sort((a, b) => (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : b.count - a.count));
  for (const m of mistakes) add(m.itemKey, m.skillId);
  const due = [...input.dueItems].filter((d) => !d.itemKey.startsWith("skill:"))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : a.ease - b.ease));
  for (const d of due) add(d.itemKey, d.skillId);
  // Due skill-level reviews.
  for (const d of input.dueItems.filter((x) => x.itemKey.startsWith("skill:"))) add(d.itemKey, d.skillId);
  // Fallback: weakest practised skills.
  const practiced = orderedSkills(input.lang).filter((s) => s.id !== primary && progressOf(input, s.id).attempts > 0 && s.category !== "review")
    .sort((a, b) => effectiveMastery(progressOf(input, a.id).mastery, progressOf(input, a.id).lastPracticedAt, input.today)
      - effectiveMastery(progressOf(input, b.id).mastery, progressOf(input, b.id).lastPracticedAt, input.today));
  for (const s of practiced) add(`skill:${s.id}`, s.id);
  return keys;
}

export const MODE_SUBTITLE: Record<LessonMode, string> = {
  new: "A new concept today",
  continue: "Another day on this topic — it's settling in",
  consolidate: "Extra practice: this topic needs a little more time",
  "welcome-back": "Welcome back — a gentle restart",
  review: "Course review",
};

export function planDailyLesson(input: PlannerInput): LessonPlan {
  const rationale: string[] = [];
  const frontier = frontierSkill(input);
  const struggling = strugglingSkills(input, frontier);
  let primary = frontier;
  let mode: LessonMode;

  const gap = input.lastStudyDate ? daysBetween(input.lastStudyDate, input.today) : 0;
  const fp = progressOf(input, frontier);

  if (struggling.length) {
    primary = struggling[0];
    mode = "consolidate";
    rationale.push(`« ${getSkill(primary).short} » has slipped recently, so today strengthens it before moving on to « ${getSkill(frontier).short} ».`);
  } else if (gap >= 5) {
    mode = "welcome-back";
    rationale.push(`It's been ${gap} days — no problem. We'll warm up with things you've learned, then carry on where you left off.`);
  } else if (getSkill(frontier).category === "review") {
    mode = fp.lessonsAsPrimary > 0 ? "continue" : "review";
    rationale.push("You've reached the final review stage of the course.");
  } else if (fp.lessonsAsPrimary > 0) {
    mode = fp.mastery < 0.5 ? "consolidate" : "continue";
    rationale.push(
      `You've practised « ${getSkill(frontier).short} » ${fp.lessonsAsPrimary === 1 ? "once" : `${fp.lessonsAsPrimary} times`} and mastery is at ${Math.floor(fp.mastery * 100)}%. Another session today — the next topic unlocks at ${Math.round(PASS_MASTERY * 100)}%.`,
    );
  } else {
    mode = "new";
    rationale.push(`Next up in the curriculum: « ${getSkill(frontier).title} ».`);
  }

  const templateId =
    baseSkillId(primary) === "w12-assessment" ? "assessment"
      : mode === "consolidate" ? "daily-consolidate"
      : mode === "welcome-back" ? "welcome-back"
      : "daily-standard";
  const warmupCount = templateId === "welcome-back" ? 4 : templateId === "daily-consolidate" ? 2 : templateId === "assessment" ? 0 : 3;
  const reviewKeys = chooseReviewKeys(input, primary, warmupCount);

  const mistakesInWarmup = input.recentMistakes.filter((m) => reviewKeys.includes(m.itemKey));
  if (input.focus && reviewKeys.includes(input.focus.missedKey)) {
    const fresh = input.focus.freshKey && reviewKeys.includes(input.focus.freshKey) ? conjOf(input.focus.freshKey)?.verb : null;
    rationale.push(
      `Focus on « nous » endings: you've missed them with ${input.focus.missedVerbs.map((v) => `« ${v} »`).join(", ")}. The warm-up revisits one${fresh ? ` and tries a new verb, « ${fresh} »` : ""}.`,
    );
  }
  if (mistakesInWarmup.length) {
    const labels = [...new Set(mistakesInWarmup.map((m) => m.label))].slice(0, 2).map((l) => `« ${l} »`).join(" and ");
    rationale.push(`Warm-up revisits ${labels}, which tripped you up recently.`);
  } else if (reviewKeys.some((k) => input.dueItems.some((d) => d.itemKey === k))) {
    rationale.push("Warm-up includes items due for spaced review.");
  }

  const skill = getSkill(primary);
  const reviewSkillIds = [...new Set(reviewKeys.map((k) => {
    if (k.startsWith("skill:")) return k.slice(6);
    return input.recentMistakes.find((m) => m.itemKey === k)?.skillId ?? input.dueItems.find((d) => d.itemKey === k)?.skillId ?? "";
  }).filter(Boolean))];

  return {
    primarySkillId: primary,
    mode,
    templateId,
    reviewKeys,
    reviewSkillIds,
    weekNumber: skill.week,
    dayNumber: (input.dailyLessonsByWeek[skill.week] ?? 0) + 1,
    title: skill.title,
    subtitle: MODE_SUBTITLE[mode],
    rationale,
  };
}
