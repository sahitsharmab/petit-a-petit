/**
 * Regression tests for the P1 audit decisions:
 * F06 scoring buckets and recaps, F08 « nous » error pattern, F09 Paris midnight,
 * F10 course review naming, F11 supported listening and guided-chat clarification.
 */
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb, schema } from "@/lib/db";
import { getSkill, WEEKS } from "@/lib/content/curriculum";
import { createPracticeLesson, getLessonExercises, getOrCreateDailyLesson } from "@/lib/services/lessons";
import { advance, completeSession, getOrStartSession, getSession, outcomeOf, submitAttempt, type ExerciseResult } from "@/lib/services/sessions";
import { loadFocusPattern, loadPlannerInput, loadStudyDates } from "@/lib/services/progress";
import { chooseReviewKeys, planDailyLesson, type PlannerInput } from "@/lib/learning/planner";
import { nousFocus, type PatternAttempt } from "@/lib/learning/patterns";
import { effectiveMastery } from "@/lib/learning/mastery";
import { endConversation, hasNegation, sendMessage, startConversation } from "@/lib/services/conversations";
import { answerUntil, right, type TestDb } from "./helpers";

const at = (d: string, hhmmUtc = "19:00") => new Date(`${d}T${hhmmUtc}:00Z`);

async function finish(db: TestDb, sessionId: string, date: Date) {
  const exercises = (await getLessonExercises(db, (await getSession(db, sessionId)).lessonId));
  let state = (await getSession(db, sessionId)).state;
  while (state.index < state.queue.length) {
    const ex = exercises.find((e) => e.id === state.queue[state.index])!;
    if (!state.results[state.retryFrom !== null && state.index >= state.retryFrom ? `${ex.id}#retry` : ex.id]?.done) {
      await submitAttempt(db, sessionId, ex.id, right(ex), 0, date);
    }
    state = (await advance(db, sessionId, state.index));
  }
  return (await completeSession(db, sessionId, date));
}

// ───────────────────────── F06 ─────────────────────────
describe("F06 · scoring buckets and honest recaps", () => {
  const r = (x: Partial<ExerciseResult>): ExerciseResult => ({ attempts: 1, hintsUsed: 0, firstVerdict: "correct", verdict: "correct", done: true, ...x });
  it("classifies first answers", async () => {
    expect(outcomeOf(r({}), undefined, 0)).toBe("exact");
    expect(outcomeOf(r({ firstVerdict: "almost", verdict: "almost" }), undefined, 0)).toBe("almost");
    expect(outcomeOf(r({}), undefined, 1)).toBe("hinted");
    expect(outcomeOf(r({ transcriptShown: true }), undefined, 1)).toBe("supported");
    expect(outcomeOf(r({ attempts: 2, firstVerdict: "incorrect", verdict: "correct" }), undefined, 0)).toBe("recovered");
    expect(outcomeOf(r({ attempts: 2, firstVerdict: "incorrect", verdict: "incorrect" }), r({ firstVerdict: "correct" }), 0)).toBe("recovered");
    expect(outcomeOf(r({ attempts: 2, firstVerdict: "incorrect", verdict: "incorrect" }), undefined, 0)).toBe("missed");
  });

  it("counts only exact unaided answers in the headline and shows the original mistake", async () => {
    const db = (await createDb(":memory:"));
    const lesson = await getOrCreateDailyLesson(db, at("2026-11-16"));
    const exercises = (await getLessonExercises(db, lesson.id));
    const s = (await getOrStartSession(db, lesson.id, at("2026-11-16")));
    const typed = exercises.filter((e) => !e.options);
    expect(typed.length).toBeGreaterThanOrEqual(2);
    // First typed exercise: wrong, then fixed on retry.
    await answerUntil(db, s.id, exercises, typed[0].id);
    await submitAttempt(db, s.id, typed[0].id, "zzz", 0, at("2026-11-16"), undefined, 1);
    await submitAttempt(db, s.id, typed[0].id, right(typed[0]), 1, at("2026-11-16"), undefined, 2);
    (await advance(db, s.id));
    // Second typed exercise: correct, but with a hint.
    await answerUntil(db, s.id, exercises, typed[1].id);
    await submitAttempt(db, s.id, typed[1].id, right(typed[1]), 1, at("2026-11-16"), undefined, 1);
    (await advance(db, s.id));
    const summary = await finish(db, s.id, at("2026-11-16"));

    expect(summary.breakdown).toMatchObject({ recovered: 1, hinted: 1, missed: 0 });
    expect(summary.firstTryCorrect).toBe(summary.breakdown!.exact);
    expect(summary.accuracy).toBeCloseTo(summary.breakdown!.exact / summary.total);
    expect(summary.accuracy).toBeLessThan(1);
    const recap = summary.mistakes.find((m) => m.exerciseId === typed[0].id)!;
    expect(recap.kind).toBe("recovered");
    expect(recap.answer).toBe("zzz");
    expect(recap.retryAnswer).toBe(right(typed[0]));
    expect(summary.nextStep).toMatch(/fixed 1 answer on a second try/);
  });
});

// ───────────────────────── F09 ─────────────────────────
describe("F09 · Paris midnight", () => {
  it("keeps the lesson's date but credits study on the day it was finished", async () => {
    const db = (await createDb(":memory:"));
    const mon2359 = new Date("2026-11-16T22:59:00Z"); // 23:59 Monday in Paris (UTC+1)
    const tue0001 = new Date("2026-11-16T23:01:00Z"); // 00:01 Tuesday in Paris
    const lesson = await getOrCreateDailyLesson(db, mon2359);
    expect(lesson.lessonDate).toBe("2026-11-16");
    const s = (await getOrStartSession(db, lesson.id, mon2359));
    await finish(db, s.id, tue0001);
    expect((await getSession(db, s.id)).studyDate).toBe("2026-11-17");
    expect((await loadStudyDates(db))).toEqual(["2026-11-17"]);
    const dates = new Set((await db.select().from(schema.exerciseAttempts).where(eq(schema.exerciseAttempts.sessionId, s.id)).all()).map((a) => a.studyDate));
    expect([...dates]).toEqual(["2026-11-17"]);
  });

  it("measures decay in Paris days, not UTC days", async () => {
    // 23:30 UTC on 16 Nov is 00:30 on 17 Nov in Paris: exactly 7 days before 24 Nov, so no decay yet.
    expect(effectiveMastery(0.8, "2026-11-16T23:30:00.000Z", "2026-11-24")).toBe(0.8);
  });
});

// ───────────────────────── F10 ─────────────────────────
describe("F10 · course review naming", () => {
  it("no longer claims A2 readiness", async () => {
    const s = getSkill("w12-assessment");
    expect(s.title).toBe("Course review");
    const text = [s.title, s.short, s.summary, ...s.objectives, ...s.explanation.map((x) => x.body), WEEKS.find((w) => w.number === 12)!.title].join(" ");
    expect(text).not.toMatch(/readiness|ready for A2|B1 material/i);
  });
});

// ───────────────────────── F11 ─────────────────────────
describe("F11 · supported listening and guided-chat clarification", () => {
  it("records listening with the transcript shown as supported, with reduced credit", async () => {
    const db = (await createDb(":memory:"));
    const lesson = (await createPracticeLesson(db, { kind: "skill", skillId: "w11-listening" }));
    const exercises = (await getLessonExercises(db, lesson.id));
    const listening = exercises.find((e) => e.type === "listening");
    expect(listening).toBeDefined();
    const s = (await getOrStartSession(db, lesson.id));
    await answerUntil(db, s.id, exercises, listening!.id);
    const res = await submitAttempt(db, s.id, listening!.id, right(listening!), 0, new Date(), undefined, 1, { transcriptShown: true });
    expect(res.state.results[listening!.id].transcriptShown).toBe(true);
    const row = (await db.select().from(schema.exerciseAttempts).all()).find((a) => a.exerciseId === listening!.id)!;
    expect(row.hintsUsed).toBe(1); // counted as assistance → credit capped like a hint
    (await advance(db, s.id));
    const summary = await finish(db, s.id, new Date());
    expect(summary.breakdown!.supported).toBe(1);
  });

  it("detects negation", async () => {
    expect(hasNegation("Je ne voudrais pas de thé, s'il vous plaît.")).toBe(true);
    expect(hasNegation("Non merci, c'est tout.")).toBe(true);
    expect(hasNegation("Je voudrais un thé.")).toBe(false);
    expect(hasNegation("Vous pouvez parler plus lentement ?")).toBe(false);
  });

  it("asks for clarification instead of taking a negated order, and reports unresolved turns", async () => {
    delete process.env.AI_PROVIDER;
    const db = (await createDb(":memory:"));
    let c = (await startConversation(db, "cafe"));
    c = await sendMessage(db, c.id, "Je ne voudrais pas de thé, s'il vous plaît.");
    expect(c.nodeId).toBe("c1");
    expect(c.messages.at(-2)!.unresolved).toBe(true);
    expect(c.messages.at(-1)!.fr).toMatch(/vous ne voulez pas/);
    c = await endConversation(db, c.id);
    expect(c.summary!.summary).toMatch(/wasn't understood/);
    expect(c.summary!.summary).toMatch(/ended before/);
    expect(c.summary!.summary).not.toMatch(/appropriate/);
  });
});

// ───────────────────────── F08 ─────────────────────────
describe("F08 · « nous » endings as one error pattern", () => {
  let id = 0;
  const att = (itemKey: string, verdict: PatternAttempt["verdict"], studyDate: string, hintsUsed = 0): PatternAttempt =>
    ({ id: ++id, itemKey, verdict, hintsUsed, studyDate, isFirst: true });
  const verbs = { present: ["parler", "travailler", "habiter", "aimer", "manger", "regarder"] };

  it("turns on when nous mistakes recur across verbs, with one missed form and one fresh verb", async () => {
    const f = nousFocus([
      att("conj:parler:present:nous", "incorrect", "2026-11-16"),
      att("conj:manger:present:nous", "incorrect", "2026-11-16"),
      att("conj:aimer:present:tu", "incorrect", "2026-11-16"),
    ], "2026-11-17", verbs);
    expect(f).not.toBeNull();
    expect(f!.missedKey).toBe("conj:manger:present:nous");
    expect(f!.freshKey).toMatch(/^conj:(travailler|habiter|aimer|regarder):present:nous$/);
    expect(f!.missedVerbs).toEqual(["parler", "manger"]);
  });

  it("stays off for a single slip", async () => {
    expect(nousFocus([att("conj:parler:present:nous", "incorrect", "2026-11-16")], "2026-11-17", verbs)).toBeNull();
  });

  it("retires after two unaided wins on different verbs, one on a later day", async () => {
    const base = [att("conj:parler:present:nous", "incorrect", "2026-11-16"), att("conj:manger:present:nous", "incorrect", "2026-11-16")];
    const sameDay = [...base, att("conj:habiter:present:nous", "correct", "2026-11-16"), att("conj:aimer:present:nous", "correct", "2026-11-16")];
    expect(nousFocus(sameDay, "2026-11-17", verbs)).not.toBeNull();
    const sameVerb = [...base, att("conj:habiter:present:nous", "correct", "2026-11-17"), att("conj:habiter:present:nous", "correct", "2026-11-17")];
    expect(nousFocus(sameVerb, "2026-11-18", verbs)).not.toBeNull();
    const hinted = [...base, att("conj:habiter:present:nous", "correct", "2026-11-17", 1), att("conj:aimer:present:nous", "correct", "2026-11-17")];
    expect(nousFocus(hinted, "2026-11-18", verbs)).not.toBeNull();
    const retired = [...base, att("conj:habiter:present:nous", "correct", "2026-11-16"), att("conj:aimer:present:nous", "correct", "2026-11-17")];
    expect(nousFocus(retired, "2026-11-18", verbs)).toBeNull();
  });

  it("puts both focus items first in the warm-up, beyond the per-skill cap", async () => {
    const input: PlannerInput = {
      today: "2026-11-17", progress: {}, dueItems: [], dailyLessonsByWeek: {},
      recentMistakes: ["parler", "manger", "aimer"].map((v) => ({ itemKey: `conj:${v}:present:nous`, skillId: "w1-er-present", label: `nous ${v}`, count: 1, lastDate: "2026-11-16" })),
      focus: { id: "nous-endings", missedKey: "conj:manger:present:nous", freshKey: "conj:habiter:present:nous", missedVerbs: ["parler", "manger", "aimer"], progress: 0 },
    };
    const keys = chooseReviewKeys(input, "w1-basic-sentences", 4);
    expect(keys.slice(0, 2)).toEqual(["conj:manger:present:nous", "conj:habiter:present:nous"]);
    expect(planDailyLesson(input).rationale.join(" ")).toMatch(/nous/);
  });

  it("is derived from the answer log and reaches tomorrow's warm-up", async () => {
    const db = (await createDb(":memory:"));
    const lesson = (await createPracticeLesson(db, { kind: "skill", skillId: "w1-er-present" }, at("2026-11-16")));
    const s = (await getOrStartSession(db, lesson.id, at("2026-11-16")));
    (await db.insert(schema.skillMastery).values({ skillId: "w1-er-present", attempts: 6, mastery: 0.5 }).run());
    for (const v of ["parler", "manger"]) {
      (await db.insert(schema.exerciseAttempts).values({
        sessionId: s.id, exerciseId: `${lesson.id}-x-${v}`, skillId: "w1-er-present", itemKey: `conj:${v}:present:nous`, exerciseType: "conjugation",
        answer: `nous ${v}ez`, expected: "", verdict: "incorrect", isCorrect: false, isFirst: true, studyDate: "2026-11-16",
      }).run());
    }
    const focus = (await loadFocusPattern(db, "2026-11-17"));
    expect(focus?.missedKey).toBe("conj:manger:present:nous");
    expect(focus?.freshKey).toMatch(/:present:nous$/);
    const input = (await loadPlannerInput(db, "2026-11-17"));
    expect(input.focus?.id).toBe("nous-endings");
    const tomorrow = await getOrCreateDailyLesson(db, at("2026-11-17"));
    const warm = (await getLessonExercises(db, tomorrow.id)).filter((e) => e.section === "warmup").map((e) => e.itemKey);
    expect(warm.some((k) => k.includes("manger:present:nous"))).toBe(true);
    expect(warm.some((k) => k === focus!.freshKey || k.endsWith(focus!.freshKey!.slice(5)))).toBe(true);
  });
});
