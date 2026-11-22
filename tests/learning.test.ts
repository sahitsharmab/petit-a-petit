import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isPastParisTime, nextParisTime, parisDate, startOfWeek } from "@/lib/learning/dates";
import { EMPTY_MASTERY, creditFor, effectiveMastery, isPassed, updateMastery } from "@/lib/learning/mastery";
import { qualityFor, scheduleReview } from "@/lib/learning/srs";
import { computeStreak } from "@/lib/learning/streak";
import { chooseReviewKeys, frontierSkill, planDailyLesson, type PlannerInput } from "@/lib/learning/planner";

describe("Europe/Paris dates", () => {
  it("uses the Paris calendar day, not UTC", () => {
    // 23:30 UTC on 21 Nov is 00:30 on 22 Nov in Paris (UTC+1).
    expect(parisDate(new Date("2026-11-21T23:30:00Z"))).toBe("2026-11-22");
    expect(parisDate(new Date("2026-11-21T22:59:00Z"))).toBe("2026-11-21");
    // Summer time (UTC+2).
    expect(parisDate(new Date("2026-07-14T22:30:00Z"))).toBe("2026-07-15");
  });
  it("handles DST transitions for reminder times", () => {
    // 20:30 Paris = 19:30 UTC in winter, 18:30 UTC in summer.
    expect(nextParisTime("20:30", new Date("2026-01-10T12:00:00Z")).toISOString()).toBe("2026-01-10T19:30:00.000Z");
    expect(nextParisTime("20:30", new Date("2026-07-10T12:00:00Z")).toISOString()).toBe("2026-07-10T18:30:00.000Z");
    // Already past → tomorrow. Across the March DST change.
    expect(nextParisTime("20:30", new Date("2026-03-28T20:00:00Z")).toISOString()).toBe("2026-03-29T18:30:00.000Z");
    expect(isPastParisTime("20:30", new Date("2026-01-10T19:45:00Z"))).toBe(true);
    expect(isPastParisTime("20:30", new Date("2026-01-10T19:15:00Z"))).toBe(false);
  });
  it("does calendar arithmetic", () => {
    expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
    expect(daysBetween("2026-03-27", "2026-03-30")).toBe(3); // across DST
    expect(startOfWeek("2026-11-21")).toBe("2026-11-16"); // Saturday → Monday
  });
});

describe("mastery", () => {
  it("rises with correct answers and reaches 'passed'", () => {
    let m = { ...EMPTY_MASTERY };
    for (let i = 0; i < 7; i++) m = updateMastery(m, 1);
    expect(m.mastery).toBeGreaterThan(0.8);
    expect(m.attempts).toBe(7);
    expect(isPassed(m)).toBe(false); // must also have been a lesson's main topic
    expect(isPassed({ ...m, lessonsAsPrimary: 1 })).toBe(true);
  });
  it("falls with mistakes and resets the correct streak", () => {
    let m = { ...EMPTY_MASTERY, attempts: 10, mastery: 0.8, consecutiveCorrect: 5, correct: 8, incorrect: 2 };
    m = updateMastery(m, 0);
    expect(m.mastery).toBeCloseTo(0.68, 2);
    expect(m.consecutiveCorrect).toBe(0);
    expect(m.incorrect).toBe(3);
  });
  it("gives partial credit for hints and accent slips", () => {
    expect(creditFor("correct", 0)).toBe(1);
    expect(creditFor("correct", 1)).toBe(0.7);
    expect(creditFor("almost", 0)).toBe(0.6);
    expect(creditFor("incorrect", 0)).toBe(0);
  });
  it("decays slowly after a week without practice", () => {
    expect(effectiveMastery(0.9, "2026-11-01", "2026-11-05")).toBe(0.9);
    expect(effectiveMastery(0.9, "2026-11-01", "2026-12-01")).toBeLessThan(0.9);
    expect(effectiveMastery(0.9, "2025-01-01", "2026-12-01")).toBeCloseTo(0.54, 2); // floor at 60%
  });
});

describe("spaced repetition", () => {
  it("spaces successful reviews 1 → 3 → ~7 days", () => {
    let s = scheduleReview(undefined, 5, "2026-11-01");
    expect(s.dueDate).toBe("2026-11-02");
    s = scheduleReview(s, 5, "2026-11-02");
    expect(s.dueDate).toBe("2026-11-05");
    s = scheduleReview(s, 5, "2026-11-05");
    expect(s.intervalDays).toBeGreaterThanOrEqual(7);
  });
  it("brings failures back tomorrow and lowers ease", () => {
    let s = scheduleReview(undefined, 5, "2026-11-01");
    s = scheduleReview(s, 5, "2026-11-02");
    const before = s.ease;
    s = scheduleReview(s, qualityFor("incorrect", 0), "2026-11-05");
    expect(s.dueDate).toBe("2026-11-06");
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeLessThan(before);
  });
  it("ignores repeat reviews on the same day", () => {
    const s = scheduleReview(undefined, 1, "2026-11-01");
    expect(scheduleReview(s, 5, "2026-11-01")).toEqual(s);
  });
  it("caps intervals at 60 days", () => {
    let s = scheduleReview(undefined, 5, "2026-01-01");
    let day = "2026-01-01";
    for (let i = 0; i < 12; i++) { day = s.dueDate; s = scheduleReview(s, 5, day); }
    expect(s.intervalDays).toBeLessThanOrEqual(60);
  });
});

describe("gentle streaks", () => {
  it("counts consecutive study days and forgives a single missed day", () => {
    expect(computeStreak(["2026-11-18", "2026-11-19", "2026-11-21"], "2026-11-21").current).toBe(3);
  });
  it("breaks after two missed days", () => {
    expect(computeStreak(["2026-11-15", "2026-11-16", "2026-11-19"], "2026-11-19").current).toBe(1);
    expect(computeStreak(["2026-11-15"], "2026-11-19").current).toBe(0);
  });
  it("stays alive until the end of today and warns when at risk", () => {
    const s = computeStreak(["2026-11-18", "2026-11-19"], "2026-11-21");
    expect(s.current).toBe(2);
    expect(s.studiedToday).toBe(false);
    expect(s.atRisk).toBe(true);
  });
});

const base = (over: Partial<PlannerInput> = {}): PlannerInput => ({
  today: "2026-11-21", progress: {}, dueItems: [], recentMistakes: [], lastStudyDate: null, dailyLessonsByWeek: {}, ...over,
});
const passed = (mastery = 0.9) => ({ ...EMPTY_MASTERY, attempts: 12, correct: 11, mastery, lessonsAsPrimary: 2, status: "mastered" as const, passedAt: "2026-11-10", lastPracticedAt: "2026-11-20" });

describe("daily lesson planner", () => {
  it("starts a new learner at Week 1 Day 1", () => {
    const plan = planDailyLesson(base());
    expect(plan.primarySkillId).toBe("w1-pronouns");
    expect(plan.mode).toBe("new");
    expect(plan.weekNumber).toBe(1);
    expect(plan.dayNumber).toBe(1);
    expect(plan.reviewKeys).toEqual([]);
  });
  it("moves forward only after a topic is passed", () => {
    const progress = { "w1-pronouns": passed() };
    expect(frontierSkill({ progress })).toBe("w1-er-present");
    const almost = { "w1-pronouns": { ...passed(0.6), passedAt: null } };
    expect(frontierSkill({ progress: almost })).toBe("w1-pronouns");
  });
  it("repeats a topic (extra day) when it isn't mastered yet", () => {
    const plan = planDailyLesson(base({ progress: { "w1-pronouns": passed(), "w1-er-present": { ...EMPTY_MASTERY, attempts: 8, mastery: 0.4, lessonsAsPrimary: 1, status: "learning" } }, dailyLessonsByWeek: { 1: 2 } }));
    expect(plan.primarySkillId).toBe("w1-er-present");
    expect(plan.mode).toBe("consolidate");
    expect(plan.templateId).toBe("daily-consolidate");
    expect(plan.dayNumber).toBe(3);
  });
  it("schedules extra practice for a passed skill that has slipped", () => {
    const progress = { "w1-pronouns": passed(), "w1-er-present": { ...passed(0.3) }, "w1-basic-sentences": passed() };
    const plan = planDailyLesson(base({
      progress,
      recentMistakes: [{ itemKey: "conj:parler:present:tu", skillId: "w1-er-present", label: "tu parles", count: 3, lastDate: "2026-11-20" }],
    }));
    expect(plan.primarySkillId).toBe("w1-er-present");
    expect(plan.mode).toBe("consolidate");
  });
  it("puts yesterday's mistakes into today's warm-up (continuity)", () => {
    const plan = planDailyLesson(base({
      progress: { "w1-pronouns": passed(), "w1-er-present": passed() },
      recentMistakes: [{ itemKey: "conj:parler:present:tu", skillId: "w1-er-present", label: "tu parles", count: 1, lastDate: "2026-11-20" }],
    }));
    expect(plan.reviewKeys[0]).toBe("conj:parler:present:tu");
    expect(plan.rationale.join(" ")).toContain("tu parles");
  });
  it("resumes gently after a long break instead of resetting", () => {
    const plan = planDailyLesson(base({ progress: { "w1-pronouns": passed() }, lastStudyDate: "2026-11-14" }));
    expect(plan.mode).toBe("welcome-back");
    expect(plan.primarySkillId).toBe("w1-er-present");
    expect(plan.templateId).toBe("welcome-back");
  });
  it("prefers due items, keeps variety and falls back to weakest skills", () => {
    const keys = chooseReviewKeys(base({
      progress: { "w1-pronouns": passed(0.95), "w2-etre": passed(0.5) },
      dueItems: [
        { itemKey: "mcq:w1-pronouns:p1", skillId: "w1-pronouns", label: "a", dueDate: "2026-11-19", ease: 2.5, lapses: 0 },
        { itemKey: "mcq:w1-pronouns:p2", skillId: "w1-pronouns", label: "b", dueDate: "2026-11-18", ease: 2.5, lapses: 0 },
        { itemKey: "mcq:w1-pronouns:p3", skillId: "w1-pronouns", label: "c", dueDate: "2026-11-17", ease: 2.5, lapses: 0 },
      ],
    }), "w3-articles", 3);
    expect(keys.slice(0, 2)).toEqual(["mcq:w1-pronouns:p3", "mcq:w1-pronouns:p2"]); // most overdue first, max 2 per skill
    expect(keys[2]).toBe("skill:w2-etre");
  });
});
