import { afterEach, describe, expect, it, vi } from "vitest";
import { createDb, schema } from "@/lib/db";
import { askJson, mergeAiExercises, validateEnhancement } from "@/lib/ai/features";
import { aiStatus, extractJson, type Provider } from "@/lib/ai/provider";
import { JudgeSchema, LessonEnhancementSchema, type LessonEnhancement } from "@/lib/ai/schemas";
import { getLessonExercises, getOrCreateDailyLesson } from "@/lib/services/lessons";
import { getOrStartSession, submitAttempt } from "@/lib/services/sessions";
import { assembleLesson } from "@/lib/learning/assemble";

const fake = (...replies: string[]): Provider & { calls: number } => {
  const p = {
    name: "ollama" as const, model: "fake", calls: 0,
    async complete() { return replies[Math.min(p.calls++, replies.length - 1)]; },
  };
  return p;
};

const validEnhancement: LessonEnhancement = {
  skillId: "w1-er-present", cefr: "A1",
  intro: "Today we practise regular -ER verbs, the most common pattern in French.",
  examples: [{ fr: "Je parle français.", en: "I speak French." }, { fr: "Nous habitons à Lyon.", en: "We live in Lyon." }],
  exercises: [
    { type: "multiple_choice", prompt: "Nous ___ anglais.", options: ["parlons", "parlez", "parle"], answerIndex: 0, explanation: "nous → -ons" },
    { type: "fill_blank", sentence: "Tu ___ à Paris.", answer: "travailles", alsoAccept: [], english: "You work in Paris.", explanation: "tu → -es" },
    { type: "translation", english: "They eat at home.", french: "Ils mangent à la maison.", alsoAccept: ["Elles mangent à la maison."], explanation: "ils → -ent" },
    { type: "dialogue", context: "At work", line: "Tu travailles ici ?", lineEnglish: "Do you work here?", options: [
      { fr: "Oui, je travaille ici.", en: "Yes, I work here.", correct: true, why: "je → -e" },
      { fr: "Oui, je travailles ici.", en: "-", correct: false, why: "-es is tu" },
      { fr: "Oui, tu travailles ici.", en: "-", correct: false, why: "about you" },
    ] },
  ],
};

afterEach(() => { vi.unstubAllEnvs(); });

describe("AI provider configuration", () => {
  it("is offline by default and reports why", () => {
    vi.stubEnv("AI_PROVIDER", "");
    expect(aiStatus().configured).toBe(false);
  });
  it("requires an API key for Anthropic", () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(aiStatus()).toMatchObject({ provider: "anthropic", configured: false });
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    expect(aiStatus()).toMatchObject({ provider: "anthropic", configured: true, model: "claude-opus-5-5" });
  });
});

describe("AI output validation", () => {
  it("extracts JSON from fenced or chatty replies", () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(() => extractJson("no json here")).toThrow();
  });
  it("accepts schema-valid output", async () => {
    const p = fake(JSON.stringify({ isCorrect: true, correctedAnswer: "x", explanation: "Looks right.", mistakeType: "none" }));
    await expect(askJson(p, "s", [{ role: "user", content: "q" }], JudgeSchema)).resolves.toMatchObject({ isCorrect: true });
  });
  it("asks once for a repair, then succeeds", async () => {
    const p = fake('{"isCorrect": "maybe"}', JSON.stringify({ isCorrect: false, correctedAnswer: "Je parle.", explanation: "conjugation" }));
    const r = await askJson(p, "s", [{ role: "user", content: "q" }], JudgeSchema);
    expect(r.isCorrect).toBe(false);
    expect(p.calls).toBe(2);
  });
  it("throws after repeated invalid output", async () => {
    await expect(askJson(fake("garbage"), "s", [{ role: "user", content: "q" }], JudgeSchema)).rejects.toThrow(/validation/);
  });
  it("rejects content for the wrong topic or level", () => {
    expect(() => validateEnhancement({ ...validEnhancement, skillId: "w8-pc-avoir" }, "w1-er-present", "L")).toThrow(/expected/);
    expect(() => validateEnhancement({ ...validEnhancement, cefr: "B1" }, "w1-er-present", "L")).toThrow(/level/);
  });
  it("drops internally inconsistent exercises", () => {
    const e = LessonEnhancementSchema.parse({
      ...validEnhancement,
      exercises: [
        { type: "multiple_choice", prompt: "x ___", options: ["a", "a", "b"], answerIndex: 0, explanation: "dup options" },
        { type: "fill_blank", sentence: "No blank here.", answer: "x", english: "x", explanation: "missing blank" },
        validEnhancement.exercises[2],
      ],
    });
    const v = validateEnhancement(e, "w1-er-present", "L");
    expect(v.exercises.map((x) => x.type)).toEqual(["translation"]);
    expect(v.exercises[0].source).toBe("ai");
  });
  it("merges AI exercises while keeping the local spine", () => {
    const local = assembleLesson({ lessonId: "L", templateId: "daily-standard", primarySkillId: "w1-er-present", reviewKeys: [], weekNumber: 1, seed: 7 });
    const ai = validateEnhancement(validEnhancement, "w1-er-present", "L").exercises;
    const merged = mergeAiExercises(local, ai);
    expect(merged).toHaveLength(local.length);
    expect(merged.filter((e) => e.source === "ai").length).toBeGreaterThanOrEqual(2);
    expect(new Set(merged.map((e) => e.id)).size).toBe(merged.length);
  });
});

describe("AI fallback", () => {
  it("falls back to local content when the enhancer fails", async () => {
    const db = createDb(":memory:");
    const lesson = await getOrCreateDailyLesson(db, new Date("2026-11-21T19:00:00Z"), async () => { throw new Error("network down"); });
    expect(lesson.source).toBe("local");
    expect(getLessonExercises(db, lesson.id).length).toBeGreaterThan(5);
  });
  it("persists AI-enhanced lessons once (no regeneration on reload)", async () => {
    const db = createDb(":memory:");
    let calls = 0;
    const enhancer = async ({ exercises, intro }: { exercises: never[]; intro: never }) => { calls++; return { exercises, intro, source: "mixed" as const }; };
    const a = await getOrCreateDailyLesson(db, new Date("2026-11-21T19:00:00Z"), enhancer as never);
    const b = await getOrCreateDailyLesson(db, new Date("2026-11-21T20:00:00Z"), enhancer as never);
    expect(a.id).toBe(b.id);
    expect(calls).toBe(1);
    expect(a.source).toBe("mixed");
  });
  it("keeps the local verdict when the AI judge fails, and uses it when it works", async () => {
    const db = createDb(":memory:");
    const lesson = await getOrCreateDailyLesson(db, new Date("2026-11-21T19:00:00Z"));
    const ex = getLessonExercises(db, lesson.id).find((e) => e.allowAiJudge)!;
    const s = getOrStartSession(db, lesson.id);
    const failing = await submitAttempt(db, s.id, ex.id, "phrase alternative", 0, new Date(), async () => { throw new Error("timeout"); });
    expect(failing.feedback.verdict).toBe("incorrect");
    expect(failing.feedback.judgedBy).toBe("local");
    const ok = await submitAttempt(db, s.id, ex.id, "une autre traduction correcte", 0, new Date(), async () => ({ isCorrect: true, correctedAnswer: "", explanation: "Also correct." }));
    expect(ok.feedback.verdict).toBe("correct");
    expect(ok.feedback.judgedBy).toBe("ai");
    expect(db.select().from(schema.exerciseAttempts).all().at(-1)!.judgedBy).toBe("ai");
  });
});
