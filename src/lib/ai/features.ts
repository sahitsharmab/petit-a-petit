import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { getSkill } from "@/lib/content/curriculum";
import type { Exercise } from "@/lib/content/types";
import { normalizeAnswer } from "@/lib/french/normalize";
import type { LessonEnhancer, LessonIntro } from "@/lib/services/lessons";
import type { AnswerJudge } from "@/lib/services/sessions";
import { extractJson, type ChatMessage, type Provider } from "./provider";
import { providerFor } from "./learner";
import { LANG_META, langOfSkill, type Lang } from "@/lib/content/languages";
import { JudgeSchema, LessonEnhancementSchema, type LessonEnhancement } from "./schemas";
import type { z } from "zod";

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

export async function cacheGet<T>(db: DB, key: string): Promise<T | null> {
  const row = await db.select().from(schema.aiCache).where(eq(schema.aiCache.key, key)).get();
  return row ? (row.payload as T) : null;
}

export async function cachePut(db: DB, key: string, kind: string, provider: string, payload: unknown) {
  await db.insert(schema.aiCache).values({ key, kind, provider, payload }).onConflictDoUpdate({ target: schema.aiCache.key, set: { payload } }).run();
}

/** Ask the provider for JSON matching `schema`; one repair attempt on invalid output. */
export async function askJson<S extends z.ZodTypeAny>(provider: Provider, system: string, messages: ChatMessage[], zschema: S, opts: { maxTokens?: number; timeoutMs?: number } = {}): Promise<z.infer<S>> {
  let lastError = "";
  const convo = [...messages];
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await provider.complete({ system, messages: convo, maxTokens: opts.maxTokens, timeoutMs: opts.timeoutMs, json: true });
    try {
      const parsed = zschema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues.slice(0, 5).map((i: z.ZodIssue) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch (e) {
      lastError = (e as Error).message;
    }
    convo.push({ role: "assistant", content: text }, { role: "user", content: `That JSON was invalid (${lastError}). Reply again with ONLY the corrected JSON object.` });
  }
  throw new Error(`AI output failed validation: ${lastError}`);
}

// ───────────────────────── lesson enhancement ─────────────────────────

function lessonSystem(lang: Lang) {
  if (lang === "de") {
    return `You are an expert German teacher writing content for an adult English speaker living in Germany.
Rules:
- All German must be grammatically perfect, natural standard German, with correct capitalisation of nouns, umlauts and ß.
- Stay strictly within the requested grammar topic and CEFR level. Short sentences at A1; slightly longer at A2.
- Prefer everyday situations in Germany: cafés, landlords, appointments, neighbours, work, transport.
- Multiple-choice distractors must be plausible learner mistakes and clearly wrong.
- For fill_blank, the sentence contains exactly one "___" and the answer is the exact missing text.
- For translation, list other fully correct German renderings in alsoAccept (word-order variants such as starting with the time, du/Sie only if the English allows).
- The JSON field names are fixed: the fields called "french" and "fr" hold the GERMAN text.
- Reply with ONLY a JSON object, no prose.`;
  }
  return `You are an expert French teacher writing content for an adult English speaker living in France.
Rules:
- All French must be grammatically perfect, natural, and use standard metropolitan French spelling with correct accents and elision.
- Stay strictly within the requested grammar topic and CEFR level. Short sentences at A1; slightly longer at A2.
- Prefer everyday situations in France: cafés, landlords, appointments, neighbours, work, transport.
- Multiple-choice distractors must be plausible learner mistakes and clearly wrong.
- For fill_blank, the sentence contains exactly one "___" and the answer is the exact missing text.
- For translation, list other fully correct French renderings in alsoAccept (word-order variants, on/nous, question forms).
- Reply with ONLY a JSON object, no prose.`;
}

function lessonPrompt(skillId: string, mistakes: string[]): string {
  const s = getSkill(skillId);
  return `Topic skill id: ${s.id}
Title: ${s.title} (CEFR ${s.cefr})
Summary: ${s.summary}
Objectives: ${s.objectives.join("; ")}
${mistakes.length ? `The learner recently struggled with: ${mistakes.slice(0, 5).join(" | ")}. Mention them kindly in the intro if relevant to this topic.` : ""}

Return JSON with this exact shape:
{
  "skillId": "${s.id}",
  "cefr": "${s.cefr}",
  "intro": "2–3 warm, encouraging sentences in English introducing today's focus (no markdown)",
  "examples": [{"fr": "...", "en": "..."}, ... 3 items],
  "exercises": [
    {"type": "multiple_choice", "prompt": "...", "options": ["...","...","..."], "answerIndex": 0, "explanation": "..."},
    {"type": "fill_blank", "sentence": "${langOfSkill(s.id) === "de" ? "Ich ___ ..." : "Je ___ ..."}", "answer": "...", "alsoAccept": [], "english": "...", "explanation": "..."},
    {"type": "translation", "english": "...", "french": "...", "alsoAccept": ["..."], "explanation": "..."},
    {"type": "dialogue", "context": "Where the conversation happens", "line": "${LANG_META[langOfSkill(s.id)].name} line from the other person", "lineEnglish": "...",
     "options": [{"fr": "...", "en": "...", "correct": true, "why": "..."}, {"fr": "...", "en": "...", "correct": false, "why": "..."}, {"fr": "...", "en": "...", "correct": false, "why": "..."}]}
  ]
}`;
}

/**
 * Domain validation beyond the schema: correct topic/level and internally
 * consistent exercises. Returns usable exercises (invalid ones are dropped).
 */
export function validateEnhancement(e: LessonEnhancement, skillId: string, lessonId: string): { exercises: Exercise[]; examples: LessonEnhancement["examples"]; intro: string } {
  const skill = getSkill(skillId);
  if (e.skillId !== skillId) throw new Error(`AI content is for ${e.skillId}, expected ${skillId}`);
  const levels = skill.cefr === "A1" ? ["A1"] : skill.cefr === "A2" ? ["A1", "A2"] : ["A2", "B1"];
  if (!levels.includes(e.cefr)) throw new Error(`AI content level ${e.cefr} is not appropriate for ${skill.cefr}`);
  const base = { skillId, rule: skill.title, source: "ai" as const, hint: skill.tip ?? skill.summary };
  const out: Exercise[] = [];
  e.exercises.forEach((x, i) => {
    const id = `${lessonId}-ai${i + 1}`;
    const itemKey = `ai:${skillId}:${hash(JSON.stringify(x))}`;
    if (x.type === "multiple_choice") {
      const uniq = new Set(x.options.map(normalizeAnswer));
      if (uniq.size !== x.options.length || x.answerIndex >= x.options.length) return;
      out.push({ ...base, id, itemKey, section: "core", type: "multiple_choice", instruction: "Choose the best answer", prompt: x.prompt, options: x.options, answerIndex: x.answerIndex, accepted: [x.options[x.answerIndex]], explanation: x.explanation });
    } else if (x.type === "fill_blank") {
      const parts = x.sentence.split("___");
      if (parts.length !== 2 || x.answer.includes("___")) return;
      out.push({ ...base, id, itemKey, section: "core", type: "fill_blank", instruction: "Fill in the blank", prompt: x.sentence, promptNote: `“${x.english}”`, blank: { before: parts[0], after: parts[1] }, accepted: [x.answer, ...x.alsoAccept], translation: x.english, audioText: x.sentence.replace("___", x.answer), explanation: x.explanation });
    } else if (x.type === "translation") {
      out.push({ ...base, id, itemKey, section: "core", type: "translation", instruction: `Translate into ${LANG_META[langOfSkill(skillId)].name}`, prompt: x.english, accepted: [x.french, ...x.alsoAccept], translation: x.english, audioText: x.french, explanation: x.explanation, allowAiJudge: true, hint: `Start with « ${x.french.split(" ").slice(0, 2).join(" ")}… ».` });
    } else if (x.type === "dialogue") {
      const correct = x.options.filter((o) => o.correct);
      if (correct.length !== 1) return;
      const idx = x.options.findIndex((o) => o.correct);
      out.push({ ...base, id, itemKey, section: "conversation", type: "dialogue", instruction: "Choose the best reply", prompt: x.context, lines: [{ who: "them", fr: x.line, en: x.lineEnglish }], audioText: x.line, options: x.options.map((o) => o.fr), answerIndex: idx, optionNotes: x.options.map((o) => o.why), accepted: [x.options[idx].fr], translation: x.options[idx].en, explanation: x.options[idx].why, hint: "Think about politeness and whether the reply answers the question." });
    }
  });
  return { exercises: out, examples: e.examples, intro: e.intro };
}

/** Merge validated AI exercises into a local lesson (keeps the local spine). */
export function mergeAiExercises(local: Exercise[], ai: Exercise[]): Exercise[] {
  const result = [...local];
  const core = ai.filter((x) => x.section === "core").slice(0, 2);
  const dialogue = ai.find((x) => x.type === "dialogue");
  // Replace the last two replaceable core items (keep conjugation drills, which the engine guarantees).
  let replaced = 0;
  for (let i = result.length - 1; i >= 0 && replaced < core.length; i--) {
    const e = result[i];
    if (e.section === "core" && ["multiple_choice", "translation", "fill_blank", "listening"].includes(e.type)) {
      result[i] = { ...core[replaced], id: e.id };
      replaced++;
    }
  }
  if (dialogue) {
    const i = result.findIndex((e) => e.section === "conversation");
    if (i >= 0) result[i] = { ...dialogue, id: result[i].id };
  }
  return result;
}

export async function createLessonEnhancer(db: DB): Promise<LessonEnhancer | undefined> {
  const settings = await db.select().from(schema.learningSettings).where(eq(schema.learningSettings.id, 1)).get();
  const provider = settings?.aiEnabled === false ? null : await providerFor(db);
  if (!provider) return undefined;
  return async ({ plan, exercises, intro, recentMistakeLabels }) => {
    const skill = getSkill(plan.primarySkillId);
    if (skill.category === "review") return null;
    const key = `lesson:${plan.primarySkillId}:${hash(exercises[0]?.id.split("-")[0] ?? "")}`;
    let enh = await cacheGet<LessonEnhancement>(db, key);
    if (!enh) {
      enh = await askJson(provider, lessonSystem(langOfSkill(plan.primarySkillId)), [{ role: "user", content: lessonPrompt(plan.primarySkillId, recentMistakeLabels) }], LessonEnhancementSchema, { maxTokens: 3000, timeoutMs: 40_000 });
      await cachePut(db, key, "lesson", provider.name, enh);
    }
    const lessonId = exercises[0]?.id.replace(/-e\d+$/, "") ?? "lesson";
    const valid = validateEnhancement(enh, plan.primarySkillId, lessonId);
    if (!valid.exercises.length) return null;
    const merged = mergeAiExercises(exercises, valid.exercises);
    const newIntro: LessonIntro = { ...intro, aiIntro: valid.intro, aiExamples: valid.examples };
    return { exercises: merged, intro: newIntro, source: "mixed" };
  };
}

// ───────────────────────── free-form answer judging ─────────────────────────

function judgeSystem(lang: Lang) {
  const L = LANG_META[lang].name;
  const leniency = lang === "de"
    ? "ignore capitalisation and final punctuation; accept valid alternative word orders (e.g. starting with the time), synonyms, and du/Sie when the English is ambiguous"
    : "ignore capitalisation and final punctuation; accept valid alternative word orders, synonyms, on/nous, question forms, and either gender when the English is ambiguous";
  const strict = lang === "de"
    ? "wrong verb endings, wrong case or article, wrong verb position, missing nicht/kein, or wrong tense"
    : "wrong conjugations, agreements, genders, missing negation parts, or wrong tense";
  return `You are a strict but kind ${L} teacher grading a learner's translation into ${L}.
Accept the answer ONLY if it is grammatically correct ${L} that conveys the same meaning as the English (${leniency}).
Do NOT accept answers with ${strict}, even if understandable.
Explain in 1–2 short English sentences, naming the grammar rule. Reply with ONLY JSON:
{"isCorrect": boolean, "correctedAnswer": "best correct ${L} version (the learner's own if correct)", "explanation": "...", "mistakeType": "none|conjugation|agreement|gender|word-order|vocabulary|spelling|tense|negation|other"}`;
}

export async function createAnswerJudge(db: DB): Promise<AnswerJudge | undefined> {
  const settings = await db.select().from(schema.learningSettings).where(eq(schema.learningSettings.id, 1)).get();
  const provider = settings?.aiEnabled === false ? null : await providerFor(db);
  if (!provider) return undefined;
  return async (ex, answer) => {
    const key = `judge:${hash(`${ex.prompt}|${ex.accepted.join("|")}|${normalizeAnswer(answer)}`)}`;
    let res = await cacheGet<z.infer<typeof JudgeSchema>>(db, key);
    if (!res) {
      res = await askJson(provider, judgeSystem(langOfSkill(ex.skillId)), [{
        role: "user",
        content: `English: ${ex.prompt}\nReference ${LANG_META[langOfSkill(ex.skillId)].name} answers: ${ex.accepted.slice(0, 6).join(" | ")}\nTopic: ${ex.rule}\nLearner's answer: ${answer}`,
      }], JudgeSchema, { maxTokens: 600, timeoutMs: 20_000 });
      await cachePut(db, key, "judge", provider.name, res);
    }
    return { isCorrect: res.isCorrect, correctedAnswer: res.correctedAnswer, explanation: res.explanation, mistakeTag: res.mistakeType === "none" ? undefined : res.mistakeType };
  };
}
