import { describe, expect, it } from "vitest";
import { createDb, schema } from "@/lib/db";
import { getOrCreateDailyLesson, getLessonExercises, createPracticeLesson } from "@/lib/services/lessons";
import { advance, completeSession, getOrStartSession, getSession, saveProgress, submitAttempt } from "@/lib/services/sessions";
import { loadPlannerInput, loadProgress } from "@/lib/services/progress";
import { exportProgress, importProgress, resetProgress } from "@/lib/services/backup";
import { getDashboard, getProgressData } from "@/lib/services/stats";
import { endConversation, sendMessage, startConversation } from "@/lib/services/conversations";
import { answerUntil, right } from "./helpers";

const at = (d: string, hhmmUtc = "19:00") => new Date(`${d}T${hhmmUtc}:00Z`);

async function playLesson(db: Awaited<ReturnType<typeof createDb>>, date: Date, wrongEvery = 0) {
  const lesson = await getOrCreateDailyLesson(db, date);
  const exercises = (await getLessonExercises(db, lesson.id));
  const s = (await getOrStartSession(db, lesson.id, date));
  let state = s.state;
  let i = 0;
  while (state.index < state.queue.length) {
    const ex = exercises.find((e) => e.id === state.queue[state.index])!;
    const wrong = wrongEvery > 0 && i++ % wrongEvery === 0;
    const r = await submitAttempt(db, s.id, ex.id, wrong ? (ex.options ? String(((ex.answerIndex ?? 0) + 1) % ex.options.length) : "zzz") : right(ex), 0, date);
    if (r.feedback.canRetry) await submitAttempt(db, s.id, ex.id, right(ex), 1, date);
    state = (await advance(db, s.id));
  }
  return { lesson, summary: (await completeSession(db, s.id, date)), sessionId: s.id };
}

describe("daily lessons & session persistence", () => {
  it("creates exactly one daily lesson per Paris date", async () => {
    const db = (await createDb(":memory:"));
    const [a, b] = await Promise.all([getOrCreateDailyLesson(db, at("2026-11-21")), getOrCreateDailyLesson(db, at("2026-11-21", "22:30"))]);
    expect(a.id).toBe(b.id);
    // 23:30 UTC is already the 22nd in Paris → a new lesson.
    const c = await getOrCreateDailyLesson(db, at("2026-11-21", "23:30"));
    expect(c.lessonDate).toBe("2026-11-22");
    expect(c.id).not.toBe(a.id);
    expect((await db.select().from(schema.generatedLessons).all())).toHaveLength(2);
  });

  it("persists in-progress state so a reload resumes at the same exercise", async () => {
    const db = (await createDb(":memory:"));
    const lesson = await getOrCreateDailyLesson(db, at("2026-11-21"));
    const ex = (await getLessonExercises(db, lesson.id));
    const s = (await getOrStartSession(db, lesson.id));
    (await saveProgress(db, s.id, { phase: "exercise", activeSecondsDelta: 30 }));
    await submitAttempt(db, s.id, ex[0].id, right(ex[0]), 0, at("2026-11-21"));
    (await advance(db, s.id));
    // "Reload": fetch the session again from the database.
    const resumed = (await getOrStartSession(db, lesson.id));
    expect(resumed.id).toBe(s.id);
    expect(resumed.state.index).toBe(1);
    expect(resumed.state.phase).toBe("exercise");
    expect(resumed.state.results[ex[0].id].verdict).toBe("correct");
    expect(resumed.activeSeconds).toBe(30);
  });

  it("caps implausible active-time deltas", async () => {
    const db = (await createDb(":memory:"));
    const lesson = await getOrCreateDailyLesson(db, at("2026-11-21"));
    const s = (await getOrStartSession(db, lesson.id));
    (await saveProgress(db, s.id, { activeSecondsDelta: 5000 }));
    expect((await getSession(db, s.id)).activeSeconds).toBe(120);
  });

  it("allows one retry, then reveals, and adds missed items to a retry round", async () => {
    const db = (await createDb(":memory:"));
    const lesson = await getOrCreateDailyLesson(db, at("2026-11-21"));
    const exercises = (await getLessonExercises(db, lesson.id));
    const typed = exercises.find((e) => !e.options)!;
    const s = (await getOrStartSession(db, lesson.id));
    await answerUntil(db, s.id, exercises, typed.id);
    const r1 = await submitAttempt(db, s.id, typed.id, "zzz", 0);
    expect(r1.feedback.canRetry).toBe(true);
    const r2 = await submitAttempt(db, s.id, typed.id, "zzz", 1);
    expect(r2.feedback.canRetry).toBe(false);
    expect(r2.state.results[typed.id].done).toBe(true);
    // Only the first attempt counts toward mastery.
    const firsts = (await db.select().from(schema.exerciseAttempts).all()).filter((a) => a.isFirst && a.exerciseId === typed.id);
    expect(firsts).toHaveLength(1);
    // Answer the rest of the main queue → retry round appended.
    let st = (await advance(db, s.id));
    while (st.retryFrom === null) {
      const ex = exercises.find((e) => e.id === st.queue[st.index])!;
      await submitAttempt(db, s.id, ex.id, right(ex), 0);
      st = (await advance(db, s.id));
    }
    expect(st.retryFrom).toBe(s.state.queue.length);
    expect(st.queue.slice(st.retryFrom!)).toContain(typed.id);
  });

  it("updates mastery, review schedule and progresses through the curriculum", async () => {
    const db = (await createDb(":memory:"));
    const day1 = await playLesson(db, at("2026-11-16"));
    expect(day1.summary.accuracy).toBe(1);
    const p1 = (await loadProgress(db))["w1-pronouns"];
    expect(p1.mastery).toBeGreaterThan(0.7);
    expect(p1.passedAt).toBeTruthy();
    const day2 = await playLesson(db, at("2026-11-17"));
    expect(day2.lesson.primarySkillId).toBe("w1-er-present");
    expect(day2.lesson.dayNumber).toBe(2);
    expect((await db.select().from(schema.reviewSchedule).all()).length).toBeGreaterThan(5);
  });

  it("remembers yesterday's mistakes for today's warm-up", async () => {
    const db = (await createDb(":memory:"));
    await playLesson(db, at("2026-11-16"), 2);
    const input = (await loadPlannerInput(db, "2026-11-17"));
    expect(input.recentMistakes.length).toBeGreaterThan(0);
    const tomorrow = await getOrCreateDailyLesson(db, at("2026-11-17"));
    const warm = (await getLessonExercises(db, tomorrow.id)).filter((e) => e.section === "warmup").map((e) => e.itemKey);
    expect(warm.some((k) => input.recentMistakes.some((m) => m.itemKey === k))).toBe(true);
    expect(tomorrow.intro.rationale.join(" ")).toMatch(/tripped you up/);
  });

  it("computes dashboard & progress from real activity only", async () => {
    const db = (await createDb(":memory:"));
    const empty = (await getDashboard(db, at("2026-11-16")));
    expect(empty.streak.current).toBe(0);
    expect(empty.curriculum.passed).toBe(0);
    await playLesson(db, at("2026-11-16"));
    const d = (await getDashboard(db, at("2026-11-16", "20:00")));
    expect(d.card.status).toBe("completed");
    expect(d.streak.current).toBe(1);
    const p = (await getProgressData(db, at("2026-11-16", "20:00")));
    expect(p.totals.lessons).toBe(1);
    expect(p.accuracy).toHaveLength(1);
  });

  it("creates targeted practice lessons", async () => {
    const db = (await createDb(":memory:"));
    const l = (await createPracticeLesson(db, { kind: "skill", skillId: "w8-pc-avoir" }));
    expect(l.kind).toBe("practice");
    expect((await getLessonExercises(db, l.id)).length).toBeGreaterThanOrEqual(6);
    const w = (await createPracticeLesson(db, { kind: "week", week: 3 }));
    expect(new Set((await getLessonExercises(db, w.id)).map((e) => e.skillId)).size).toBeGreaterThan(1);
  });
});

describe("backup", () => {
  it("round-trips progress through export/import", async () => {
    const db = (await createDb(":memory:"));
    await playLesson(db, at("2026-11-16"), 3);
    const dump = JSON.parse(JSON.stringify((await exportProgress(db))));
    const other = (await createDb(":memory:"));
    const counts = (await importProgress(other, dump));
    expect(counts.exerciseAttempts).toBe(dump.data.exerciseAttempts.length);
    expect((await loadProgress(other))).toEqual((await loadProgress(db)));
  });
  it("rejects invalid backups without changing anything", async () => {
    const db = (await createDb(":memory:"));
    await playLesson(db, at("2026-11-16"));
    const before = (await db.select().from(schema.exerciseAttempts).all()).length;
    await expect(importProgress(db, { app: "other" })).rejects.toThrow();
    const bad = (await exportProgress(db));
    (bad.data.exerciseAttempts as Record<string, unknown>[]).push({ nonsense: true });
    await expect(importProgress(db, JSON.parse(JSON.stringify(bad)))).rejects.toThrow();
    expect((await db.select().from(schema.exerciseAttempts).all()).length).toBe(before);
  });
  it("resets progress", async () => {
    const db = (await createDb(":memory:"));
    await playLesson(db, at("2026-11-16"));
    (await resetProgress(db));
    expect((await db.select().from(schema.generatedLessons).all())).toHaveLength(0);
    expect((await db.select().from(schema.learningSettings).all())).toHaveLength(1);
  });
});

describe("scripted conversations (offline)", () => {
  it("runs a full scenario, records corrections and produces a summary", async () => {
    delete process.env.AI_PROVIDER;
    const db = (await createDb(":memory:"));
    let c = (await startConversation(db, "cafe"));
    expect(c.mode).toBe("scripted");
    c = await sendMessage(db, c.id, "Donne-moi un café.");
    expect(c.messages.find((m) => m.role === "learner")?.correction?.corrected).toContain("s'il vous plaît");
    c = await sendMessage(db, c.id, "", 1);
    c = await sendMessage(db, c.id, "sur place svp");
    c = await sendMessage(db, c.id, "", 0);
    expect(c.nodeId).toBe("c5");
    c = await endConversation(db, c.id);
    expect(c.status).toBe("completed");
    expect(c.summary!.corrections).toHaveLength(1);
    expect(c.summary!.vocabulary.length).toBeGreaterThan(0);
  });
  it("asks to rephrase when free text doesn't match", async () => {
    const db = (await createDb(":memory:"));
    const c = await sendMessage(db, (await startConversation(db, "cafe")).id, "J'aime les éléphants");
    expect(c.messages.at(-1)!.fr).toMatch(/pas bien compris/);
    expect(c.nodeId).toBe("c1");
  });
});
