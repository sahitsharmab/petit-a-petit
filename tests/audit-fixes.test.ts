/**
 * Regression tests for the P0 audit findings (commit 09c02fc audit):
 * F01 negation, F02 session integrity, F03 backup restore, F04 week 12 revision,
 * F05 AI switch on open chats, F07 question grading and alternatives, F13 cross-site requests.
 */
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, schema } from "@/lib/db";
import { FRAMES, negateComplement } from "@/lib/content/frames";
import { BANK } from "@/lib/content/bank";
import { WEEKS } from "@/lib/content/curriculum";
import { evaluateAnswer } from "@/lib/french/evaluate";
import { createPracticeLesson, getLessonExercises, getOrCreateDailyLesson } from "@/lib/services/lessons";
import { advance, completeSession, getOrStartSession, getSession, saveProgress, submitAttempt } from "@/lib/services/sessions";
import { loadProgress } from "@/lib/services/progress";
import { BackupError, exportProgress, importProgress, previewImport } from "@/lib/services/backup";
import { endConversation, explainLast, sendMessage, startConversation } from "@/lib/services/conversations";
import { isCrossSite } from "@/lib/api";
import { answerUntil, right, type TestDb } from "./helpers";

const at = (d: string, hhmmUtc = "19:00") => new Date(`${d}T${hhmmUtc}:00Z`);
const attemptRows = (db: TestDb, sessionId: string) =>
  db.select().from(schema.exerciseAttempts).where(eq(schema.exerciseAttempts.sessionId, sessionId)).all();

async function startLesson() {
  const db = createDb(":memory:");
  const lesson = await getOrCreateDailyLesson(db, at("2026-11-16"));
  const exercises = getLessonExercises(db, lesson.id);
  const s = getOrStartSession(db, lesson.id, at("2026-11-16"));
  return { db, lesson, exercises, s, current: () => exercises.find((e) => e.id === getSession(db, s.id).state.queue[getSession(db, s.id).state.index])! };
}

/** Answer everything correctly and complete. */
async function finishLesson(db: TestDb, sessionId: string, exercises: ReturnType<typeof getLessonExercises>, date = at("2026-11-16")) {
  let state = getSession(db, sessionId).state;
  while (state.index < state.queue.length) {
    const ex = exercises.find((e) => e.id === state.queue[state.index])!;
    await submitAttempt(db, sessionId, ex.id, right(ex), 0, date);
    state = advance(db, sessionId, state.index);
  }
  return completeSession(db, sessionId, date);
}

// ───────────────────────── F01 ─────────────────────────
describe("F01 · negative complements", () => {
  it("matches whole determiners and elides only before a vowel sound", () => {
    expect(negateComplement("une pomme")).toBe("de pomme");
    expect(negateComplement("une crêpe")).toBe("de crêpe");
    expect(negateComplement("un appartement")).toBe("d'appartement");
    expect(negateComplement("une écharpe")).toBe("d'écharpe");
    expect(negateComplement("de l'eau")).toBe("d'eau");
    expect(negateComplement("des légumes")).toBe("de légumes");
    expect(negateComplement("du yoga")).toBe("de yoga");
    expect(negateComplement("au restaurant")).toBe("au restaurant");
  });
  it("never produces a malformed form for any frame", () => {
    for (const frames of Object.values(FRAMES)) {
      for (const f of frames) {
        const n = negateComplement(f.fr);
        expect(n, f.fr).not.toMatch(/^d'(e|es|u) /);
        expect(n, f.fr).not.toMatch(/^d'[bcdfgjklmnpqrstvwxyz]/i);
      }
    }
  });
  it("accepts the correct negation and rejects the malformed one", () => {
    const accepted = ["Nous ne mangeons pas de pomme."];
    const opts = { accepted, unchangedFrom: "Nous mangeons une pomme." };
    expect(evaluateAnswer({ answer: "Nous ne mangeons pas de pomme.", ...opts }).verdict).toBe("correct");
    expect(evaluateAnswer({ answer: "Nous ne mangeons pas d'e pomme.", ...opts }).verdict).toBe("incorrect");
  });
});

// ───────────────────────── F07 ─────────────────────────
describe("F07 · question grading and common alternatives", () => {
  const q = ["Est-ce que tu parles français ?", "Tu parles français ?", "Parles-tu français ?"];
  const grade = (answer: string) => evaluateAnswer({ answer, accepted: q, unchangedFrom: "Tu parles français." }).verdict;
  it("does not accept the unchanged statement as a question", () => {
    expect(grade("Tu parles français.")).toBe("incorrect");
    expect(grade("Tu parles français")).toBe("incorrect");
  });
  it("accepts intonation with « ? », est-ce que and inversion", () => {
    expect(grade("Tu parles français ?")).toBe("correct");
    expect(grade("tu parles français?")).toBe("correct");
    expect(grade("Est-ce que tu parles français")).toBe("correct");
    expect(grade("Parles-tu français ?")).toBe("correct");
  });
  it("accepts natural formal and informal variants", () => {
    const sentence = (skill: string, id: string) => BANK[skill].sentences!.find((x) => x.id === id)!;
    const accepts = (skill: string, id: string, answer: string) => {
      const s = sentence(skill, id);
      return evaluateAnswer({ answer, accepted: [s.fr, ...(s.alts ?? [])] }).verdict;
    };
    const bs5 = Object.keys(BANK).find((k) => BANK[k].sentences?.some((x) => x.id === "b-s5"))!;
    const sis3 = Object.keys(BANK).find((k) => BANK[k].sentences?.some((x) => x.id === "si-s3"))!;
    expect(accepts(bs5, "b-s5", "Bonjour, comment allez-vous ?")).toBe("correct");
    expect(accepts(bs5, "b-s5", "Bonjour, comment ça va ?")).toBe("correct");
    expect(accepts(sis3, "si-s3", "Pourriez-vous parler plus lentement, s'il vous plaît ?")).toBe("correct");
    expect(accepts(sis3, "si-s3", "Pouvez-vous parler plus lentement ?")).toBe("correct");
  });
});

// ───────────────────────── F02 ─────────────────────────
describe("F02 · session actions are safe to retry", () => {
  it("records a duplicated submit only once", async () => {
    const { db, s, current } = await startLesson();
    const ex = current();
    const a = await submitAttempt(db, s.id, ex.id, right(ex), 0, new Date(), undefined, 1);
    const b = await submitAttempt(db, s.id, ex.id, right(ex), 0, new Date(), undefined, 1);
    expect(b.feedback).toEqual(a.feedback);
    // Same answer again without an attempt number (older clients) is also a no-op once done.
    await submitAttempt(db, s.id, ex.id, right(ex), 0);
    expect(attemptRows(db, s.id)).toHaveLength(1);
  });

  it("records concurrent submits of the same attempt once, even while the AI judge is pending", async () => {
    const { db, lesson, exercises, s } = await startLesson();
    const typed = exercises.find((e) => e.allowAiJudge)!;
    expect(typed, "day-1 lesson should contain an AI-judgeable translation").toBeDefined();
    await answerUntil(db, s.id, exercises, typed.id);
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const judge = async () => { await gate; return { isCorrect: true, correctedAnswer: "", explanation: "ok" }; };
    const p1 = submitAttempt(db, s.id, typed.id, "une autre phrase", 0, new Date(), judge, 1);
    const p2 = submitAttempt(db, s.id, typed.id, "une autre phrase", 0, new Date(), judge, 1);
    release();
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r2.feedback.verdict).toBe(r1.feedback.verdict);
    expect(attemptRows(db, s.id).filter((a) => a.exerciseId === typed.id)).toHaveLength(1);
    expect(lesson.id).toBeTruthy();
  });

  it("only accepts answers for the current exercise and valid choices", async () => {
    const { db, exercises, s } = await startLesson();
    const state = getSession(db, s.id).state;
    const later = exercises.find((e) => e.id === state.queue[state.queue.length - 1])!;
    await expect(submitAttempt(db, s.id, later.id, right(later), 0)).rejects.toMatchObject({ status: 409 });
    const choice = exercises.find((e) => e.options);
    if (choice) {
      await answerUntil(db, s.id, exercises, choice.id);
      await expect(submitAttempt(db, s.id, choice.id, "99", 0)).rejects.toMatchObject({ status: 400 });
      await expect(submitAttempt(db, s.id, choice.id, "", 0)).rejects.toMatchObject({ status: 400 });
    }
  });

  it("never skips a question on repeated or premature advance", async () => {
    const { db, s, current } = await startLesson();
    expect(() => advance(db, s.id, 0)).toThrow(/Answer this exercise/);
    const ex = current();
    await submitAttempt(db, s.id, ex.id, right(ex), 0, new Date(), undefined, 1);
    expect(advance(db, s.id, 0).index).toBe(1);
    expect(advance(db, s.id, 0).index).toBe(1); // duplicate delivery
    expect(() => advance(db, s.id, 1)).toThrow(/Answer this exercise/);
    // Navigation can't jump past unanswered exercises either.
    saveProgress(db, s.id, { index: 5 });
    expect(getSession(db, s.id).state.index).toBe(1);
  });

  it("refuses to complete an unfinished lesson, and completing twice credits once", async () => {
    const { db, lesson, exercises, s, current } = await startLesson();
    const ex = current();
    await submitAttempt(db, s.id, ex.id, right(ex), 0);
    advance(db, s.id, 0);
    expect(() => completeSession(db, s.id)).toThrow(/Finish every exercise/);
    expect(getSession(db, s.id).status).toBe("in_progress");
    expect(loadProgress(db)[lesson.primarySkillId]?.lessonsAsPrimary ?? 0).toBe(0);

    const summary = await finishLesson(db, s.id, exercises);
    expect(summary.total).toBe(exercises.length);
    const again = completeSession(db, s.id);
    expect(again).toEqual(summary);
    expect(loadProgress(db)[lesson.primarySkillId].lessonsAsPrimary).toBe(1);
  });
});

// ───────────────────────── F03 ─────────────────────────
describe("F03 · backup restore validates before replacing", () => {
  let dir: string;
  beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "francais-backup-")); });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  async function withProgress() {
    const { db, exercises, s } = await startLesson();
    await finishLesson(db, s.id, exercises);
    return db;
  }
  const clone = (x: unknown) => JSON.parse(JSON.stringify(x));

  it("rejects a file with a missing section and leaves progress untouched", async () => {
    const db = await withProgress();
    const before = db.select().from(schema.exerciseAttempts).all().length;
    const bad = clone(exportProgress(db));
    delete bad.data.exerciseAttempts;
    expect(() => importProgress(db, bad)).toThrow(BackupError);
    expect(() => importProgress(db, bad)).toThrow(/exerciseAttempts/);
    expect(db.select().from(schema.exerciseAttempts).all().length).toBe(before);
  });

  it("rejects answer history that doesn't match the sessions", async () => {
    const db = await withProgress();
    const bad = clone(exportProgress(db));
    bad.data.exerciseAttempts = bad.data.exerciseAttempts.slice(1);
    expect(() => importProgress(db, bad)).toThrow(/incomplete/);
  });

  it("rejects damaged rows and nested state", async () => {
    const db = await withProgress();
    const wrongType = clone(exportProgress(db));
    wrongType.data.lessonSessions[0].activeSeconds = "lots";
    expect(() => importProgress(db, wrongType)).toThrow(/should be a number/);
    const badState = clone(exportProgress(db));
    badState.data.lessonSessions[0].state = { queue: "nope" };
    expect(() => importProgress(db, badState)).toThrow(/damaged lesson state/);
    const orphan = clone(exportProgress(db));
    orphan.data.generatedLessons = [];
    expect(() => importProgress(db, orphan)).toThrow(/isn't in the backup/);
  });

  it("previews counts without changing anything, and keeps a safety copy before replacing", async () => {
    const db = await withProgress();
    const dump = clone(exportProgress(db));
    const preview = previewImport(dump);
    expect(preview.exerciseAttempts).toBe(dump.data.exerciseAttempts.length);
    const other = createDb(":memory:");
    const res = importProgress(other, dump, { safetyCopyDir: dir });
    expect(res.exerciseAttempts).toBe(dump.data.exerciseAttempts.length);
    expect(res.safetyCopy && fs.existsSync(res.safetyCopy)).toBe(true);
    expect(JSON.parse(fs.readFileSync(res.safetyCopy!, "utf8")).app).toBe("petit-a-petit");
    expect(loadProgress(other)).toEqual(loadProgress(db));
  });
});

// ───────────────────────── F04 ─────────────────────────
describe("F04 · every week's revision works", () => {
  it("builds a non-empty revision lesson for all weeks, including review-only week 12", () => {
    const db = createDb(":memory:");
    for (const w of WEEKS) {
      const lesson = createPracticeLesson(db, { kind: "week", week: w.number });
      expect(getLessonExercises(db, lesson.id).length, `week ${w.number}`).toBeGreaterThan(0);
    }
  });
});

// ───────────────────────── F05 ─────────────────────────
describe("F05 · switching AI off applies to open conversations", () => {
  let server: http.Server;
  let requests = 0;
  const env = { ...process.env };
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      requests++;
      req.resume();
      req.on("end", () => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ message: { content: JSON.stringify({
          reply: "Bonjour ! Qu'est-ce que je vous sers ?", replyEnglish: "Hello! What can I get you?", correction: null,
          suggestions: [{ fr: "Un café, s'il vous plaît.", en: "A coffee, please." }], done: false,
          text: "Explanation.", summary: "Good job overall.", corrections: [], vocabulary: [], reviewSkillIds: [], encouragement: "Bravo",
        }) } }));
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as { port: number }).port;
    process.env.AI_PROVIDER = "ollama";
    process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${port}`;
    process.env.OLLAMA_MODEL = `stub-${port}`; // fresh provider cache key
  });
  afterAll(async () => {
    process.env = env;
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("stops sending messages, explanations and summaries to the provider", async () => {
    const db = createDb(":memory:");
    let c = startConversation(db, "cafe");
    expect(c.mode).toBe("ai");
    c = await sendMessage(db, c.id, "Bonjour, un café s'il vous plaît.");
    const afterAiTurn = requests;
    expect(afterAiTurn).toBeGreaterThan(0);

    db.update(schema.learningSettings).set({ aiEnabled: false }).where(eq(schema.learningSettings.id, 1)).run();
    c = await sendMessage(db, c.id, "Merci beaucoup.");
    expect(c.mode).toBe("scripted");
    expect(c.messages.some((m) => m.role === "note" && /AI is turned off/.test(m.fr))).toBe(true);
    await explainLast(db, c.id);
    await endConversation(db, c.id);
    expect(requests).toBe(afterAiTurn);
  });
});

// ───────────────────────── F13 ─────────────────────────
describe("F13 · cross-site mutation requests are refused", () => {
  const req = (method: string, headers: Record<string, string>) => new Request("http://127.0.0.1:3000/api/reset", { method, headers });
  it("allows same-origin and local tools, blocks other sites", () => {
    expect(isCrossSite(req("POST", { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin" }))).toBe(false);
    expect(isCrossSite(req("POST", { host: "127.0.0.1:3000" }))).toBe(false);
    expect(isCrossSite(req("GET", { host: "127.0.0.1:3000", origin: "https://evil.example" }))).toBe(false);
    expect(isCrossSite(req("POST", { host: "127.0.0.1:3000", origin: "https://evil.example" }))).toBe(true);
    expect(isCrossSite(req("POST", { host: "127.0.0.1:3000", "sec-fetch-site": "cross-site" }))).toBe(true);
  });
});
