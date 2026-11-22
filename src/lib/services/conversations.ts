import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { SKILL_BY_ID, getSkill } from "@/lib/content/curriculum";
import { LANG_META, langOfSkill, type Lang } from "@/lib/content/languages";
import { getScenario, type Scenario, type ScriptReply } from "@/lib/content/scenarios";
import { looseAnswer, tokenize } from "@/lib/french/normalize";
import { parisDate } from "@/lib/learning/dates";
import { frontierSkill } from "@/lib/learning/planner";
import { askJson } from "@/lib/ai/features";
import { providerFor } from "@/lib/ai/learner";
import { ConversationSummarySchema, ConversationTurnSchema, HelpSchema, type ConversationSummary } from "@/lib/ai/schemas";
import { loadProgress } from "./progress";
import { HttpError } from "@/lib/http-error";

export interface ChatMessage {
  role: "partner" | "learner" | "note";
  fr: string;
  en?: string;
  correction?: { original: string; corrected: string; explanation: string } | null;
  /** Model phrasing for a learner message (scripted mode). */
  model?: string;
  /** Scripted mode: the partner couldn't tell what the learner meant and asked them to clarify. */
  unresolved?: boolean;
  suggestions?: { fr: string; en: string }[];
  at: string;
}

export interface ConversationRecord {
  id: string;
  scenarioId: string;
  mode: "ai" | "scripted";
  status: "active" | "completed";
  level: string;
  messages: ChatMessage[];
  nodeId: string | null;
  summary: ConversationSummary | null;
  studyDate: string;
}

async function read(db: DB, id: string): Promise<ConversationRecord> {
  const row = await db.select().from(schema.conversationSessions).where(eq(schema.conversationSessions.id, id)).get();
  if (!row) throw new HttpError(404, "Conversation not found");
  return { ...row, mode: row.mode as ConversationRecord["mode"], status: row.status as ConversationRecord["status"], messages: row.messages as ChatMessage[], summary: row.summary as ConversationSummary | null };
}

/** Learner level, from curriculum progress, controls partner difficulty. */
export async function learnerLevel(db: DB): Promise<{ cefr: string; week: number; guidance: string }> {
  const week = getSkill(frontierSkill({ progress: await loadProgress(db), lang: db.lang })).week;
  if (db.lang === "de") {
    if (week <= 3) return { cefr: "A1", week, guidance: "Use very short sentences (max ~8 words), present tense only, very common words. One question at a time." };
    if (week <= 6) return { cefr: "A1+", week, guidance: "Use short sentences (max ~10 words), mostly present tense, some modal verbs. One question at a time." };
    if (week <= 9) return { cefr: "A2", week, guidance: "Use simple sentences (max ~14 words). Present and Perfekt are fine; keep the verb in second position." };
    return { cefr: "A2+", week, guidance: "Natural but clear everyday German, up to ~16 words. Mix tenses naturally; occasionally use weil/dass clauses." };
  }
  if (week <= 3) return { cefr: "A1", week, guidance: "Use very short sentences (max ~8 words), present tense only, very common words. One question at a time." };
  if (week <= 6) return { cefr: "A1+", week, guidance: "Use short sentences (max ~10 words), mostly present tense, some aller + infinitive. One question at a time." };
  if (week <= 9) return { cefr: "A2", week, guidance: "Use simple sentences (max ~14 words). Present, futur proche and passé composé are fine." };
  return { cefr: "A2+", week, guidance: "Natural but clear everyday French, up to ~16 words. Mix tenses naturally; occasionally use object pronouns." };
}

const now = () => new Date().toISOString();

/** The AI provider, but only while AI is switched on in Settings. Checked at every provider call. */
async function allowedProvider(db: DB) {
  const settings = await db.select().from(schema.learningSettings).where(eq(schema.learningSettings.id, 1)).get();
  return settings?.aiEnabled === false ? null : providerFor(db);
}

export async function startConversation(db: DB, scenarioId: string, date: Date = new Date()): Promise<ConversationRecord> {
  const sc = getScenario(scenarioId);
  if (!sc || langOfSkill(sc.id) !== db.lang) throw new HttpError(404, "Unknown scenario");
  const mode = (await allowedProvider(db)) ? "ai" : "scripted";
  const first = sc.nodes[sc.start];
  const messages: ChatMessage[] = [{ role: "partner", fr: first.them.fr, en: first.them.en, suggestions: first.replies.filter((r) => r.ok !== false).map((r) => ({ fr: r.fr, en: r.en })), at: now() }];
  const id = `C-${randomUUID().slice(0, 13)}`;
  await db.insert(schema.conversationSessions).values({
    id, scenarioId, mode, status: "active", level: (await learnerLevel(db)).cefr, messages, nodeId: sc.start, studyDate: parisDate(date),
  }).run();
  return read(db, id);
}

/** Score how well free text matches a scripted reply (0–1). */
export function matchScore(text: string, reply: ScriptReply): number {
  const t = new Set(tokenize(looseAnswer(text)).map((w) => w.replace(/'$/, "")));
  const target = tokenize(looseAnswer(reply.fr)).map((w) => w.replace(/'$/, "")).filter((w) => w.length >= 3);
  const keywords = (reply.keywords ?? []).map((k) => looseAnswer(k));
  const kwHit = keywords.some((k) => (k.includes(" ") ? looseAnswer(text).includes(k) : t.has(k)));
  if (!target.length) return kwHit ? 0.6 : 0;
  const overlap = target.filter((w) => t.has(w)).length / target.length;
  return Math.min(1, overlap + (kwHit ? 0.35 : 0));
}

/** Does the text negate something (ne … pas / jamais / rien / personne, or a leading « non »)? */
export function hasNegation(text: string, lang: Lang = "fr"): boolean {
  const t = ` ${looseAnswer(text)} `;
  if (lang === "de") return /^\snein\s/.test(t) || /\s(nicht|kein|keine|keinen|keinem|keiner|nie|niemals|nichts)\s/.test(t);
  return /^\snon\s/.test(t) || (/\s(ne\s|n')/.test(t) && /\s(pas|jamais|rien|personne)\s/.test(t));
}

/** Why the partner couldn't act on a free-text reply, or null when the intent is clear. */
/** The partner's stock lines when a free-text reply can't be acted on, in the scenario's language and register. */
function partnerLines(sc: Scenario) {
  if (langOfSkill(sc.id) === "de") {
    const du = sc.register === "tu";
    return {
      unclear: { fr: du ? "Entschuldigung, das habe ich nicht verstanden. Kannst du das anders sagen?" : "Entschuldigung, das habe ich nicht verstanden. Können Sie das anders sagen?", en: "Sorry, I didn't understand that. Can you say it another way?" },
      negated: { fr: du ? "Oh, Entschuldigung: Das willst du nicht? Was möchtest du denn?" : "Oh, Entschuldigung: Das möchten Sie nicht? Was möchten Sie denn?", en: "Oh, sorry: you don't want that? What would you like, then?" },
      mean: (a: string, b: string) => (du ? `Entschuldigung, meinst du « ${a} » oder « ${b} »?` : `Entschuldigung, meinen Sie « ${a} » oder « ${b} »?`),
    };
  }
  return {
    unclear: { fr: "Pardon, je n'ai pas bien compris. Vous pouvez reformuler ?", en: "Sorry, I didn't quite understand. Can you rephrase?" },
    negated: { fr: "Ah, pardon : vous ne voulez pas ça ? Qu'est-ce que vous voulez, alors ?", en: "Oh, sorry: you don't want that? What would you like, then?" },
    mean: (a: string, b: string) => `Pardon, vous voulez dire « ${a} » ou « ${b} » ?`,
  };
}

function unclearIntent(sc: Scenario, text: string, scored: { r: ScriptReply; s: number }[]): { fr: string; en: string; suggestions: ScriptReply[] } | null {
  const best = scored[0];
  const lang = langOfSkill(sc.id);
  const p = partnerLines(sc);
  if (!best || best.s < 0.4) return { ...p.unclear, suggestions: [] };
  // « Je ne voudrais pas de thé » shares words with « Je voudrais un thé » but means the opposite.
  if (hasNegation(text, lang) && !hasNegation(best.r.fr, lang)) return { ...p.negated, suggestions: [] };
  const rival = scored.find((x) => x !== best && x.r.next !== best.r.next && x.r.ok !== false && x.s >= 0.4 && best.s - x.s < 0.1);
  if (rival) {
    return { fr: p.mean(best.r.fr, rival.r.fr), en: `Sorry, do you mean "${best.r.en}" or "${rival.r.en}"?`, suggestions: [best.r, rival.r] };
  }
  return null;
}

function scriptedTurn(sc: Scenario, nodeId: string, text: string, replyIndex?: number) {
  const node = sc.nodes[nodeId];
  let chosen: ScriptReply | undefined;
  if (replyIndex !== undefined) chosen = node.replies[replyIndex];
  else {
    const scored = node.replies.map((r) => ({ r, s: matchScore(text, r) })).sort((a, b) => b.s - a.s);
    const unclear = unclearIntent(sc, text, scored);
    if (unclear) {
      const good = unclear.suggestions.filter((r) => r.ok !== false);
      const options = good.length ? good : node.replies.filter((r) => r.ok !== false);
      return {
        learner: { role: "learner" as const, fr: text, unresolved: true, at: now() },
        partner: {
          role: "partner" as const, fr: unclear.fr, en: unclear.en,
          suggestions: options.map((r) => ({ fr: r.fr, en: r.en })), at: now(),
        },
        nextNode: nodeId,
      };
    }
    chosen = scored[0].r;
  }
  if (!chosen) {
    return {
      learner: { role: "learner" as const, fr: text, unresolved: true, at: now() },
      partner: {
        role: "partner" as const, ...partnerLines(sc).unclear,
        suggestions: node.replies.filter((r) => r.ok !== false).map((r) => ({ fr: r.fr, en: r.en })), at: now(),
      },
      nextNode: nodeId,
    };
  }
  const exact = looseAnswer(text) === looseAnswer(chosen.fr);
  const goodAlternative = node.replies.find((r) => r.ok !== false && r.next === chosen!.next) ?? node.replies.find((r) => r.ok !== false);
  const learner: ChatMessage = {
    role: "learner", fr: text, at: now(),
    correction: chosen.ok === false ? { original: text, corrected: goodAlternative?.fr ?? chosen.fr, explanation: chosen.why ?? "" } : null,
    model: chosen.ok !== false && !exact && replyIndex === undefined ? chosen.fr : undefined,
  };
  const next = chosen.next ? sc.nodes[chosen.next] : null;
  const partner: ChatMessage | null = next
    ? { role: "partner", fr: next.them.fr, en: next.them.en, suggestions: next.replies.filter((r) => r.ok !== false).map((r) => ({ fr: r.fr, en: r.en })), at: now() }
    : null;
  return { learner, partner, nextNode: chosen.next };
}

function aiSystem(sc: Scenario, level: Awaited<ReturnType<typeof learnerLevel>>) {
  const L = LANG_META[langOfSkill(sc.id)];
  return `You are role-playing ${sc.partner} in ${L.code === "de" ? "Germany" : "France"}, talking with an English-speaking learner of ${L.name}.
Scenario goal for the learner: ${sc.goal}
Address the learner with "${L.code === "de" ? (sc.register === "tu" ? "du" : "Sie") : sc.register}". Learner level: ${level.cefr}. ${level.guidance}
Stay in character and keep the conversation moving toward the goal. Reply in ${L.name} only in "reply".
Corrections: only correct real grammar or vocabulary errors in the learner's LAST message, gently, and don't correct trivial issues (missing accents, capitals, punctuation). If it was fine, correction is null.
Offer 2–3 short suggested replies the learner could say next, at their level.
Set "done": true only when the scenario has naturally concluded (after a goodbye).
Reply with ONLY this JSON:
{"reply": "...", "replyEnglish": "...", "correction": null | {"original": "...", "corrected": "...", "explanation": "short English explanation"}, "suggestions": [{"fr": "...", "en": "..."}], "done": false}`;
}

function toChatHistory(messages: ChatMessage[]) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (m.role === "note") continue;
    const role = m.role === "partner" ? ("assistant" as const) : ("user" as const);
    const content = m.role === "partner" ? JSON.stringify({ reply: m.fr, replyEnglish: m.en ?? "" }) : m.fr;
    if (out.length === 0 && role === "assistant") out.push({ role: "user", content: "(The learner joins the conversation.)" });
    out.push({ role, content });
  }
  return out;
}

export async function sendMessage(db: DB, id: string, text: string, replyIndex?: number, date: Date = new Date()): Promise<ConversationRecord> {
  const conv = await read(db, id);
  if (conv.status === "completed") throw new HttpError(409, "This conversation has ended.");
  const sc = getScenario(conv.scenarioId)!;
  const clean = text.trim().slice(0, 400);
  if (!clean && replyIndex === undefined) throw new HttpError(400, "Message is empty.");
  let messages = [...conv.messages];
  let nodeId = conv.nodeId;
  let status: ConversationRecord["status"] = "active";
  let mode = conv.mode;

  if (mode === "ai" && !(await allowedProvider(db))) {
    // AI was switched off (or unconfigured) after this chat started: stop sending it anything.
    mode = "scripted";
    messages.push({ role: "note", fr: "AI is turned off, so this conversation continues on the guided script. Nothing more is sent to the AI partner.", at: now() });
  }
  if (mode === "ai") {
    const provider = await allowedProvider(db);
    try {
      if (!provider) throw new Error("AI provider not configured");
      const learner: ChatMessage = { role: "learner", fr: clean, at: now() };
      const turn = await askJson(provider, aiSystem(sc, await learnerLevel(db)), [...toChatHistory(messages), { role: "user", content: clean }], ConversationTurnSchema, { maxTokens: 900, timeoutMs: 30_000 });
      learner.correction = turn.correction && turn.correction.corrected.trim() && turn.correction.corrected.trim() !== clean ? turn.correction : null;
      messages = [...messages, learner, { role: "partner", fr: turn.reply, en: turn.replyEnglish, suggestions: turn.suggestions, at: now() }];
      if (turn.done) status = "active"; // learner ends explicitly to get the summary
    } catch (err) {
      console.warn("[conversation] AI failed, switching to guided script:", (err as Error).message);
      mode = "scripted";
      messages.push({ role: "note", fr: "The AI partner is unavailable right now, so this conversation continues on the guided script.", at: now() });
    }
  }
  if (mode === "scripted") {
    const reply = replyIndex !== undefined ? sc.nodes[nodeId ?? sc.start].replies[replyIndex] : undefined;
    const t = scriptedTurn(sc, nodeId ?? sc.start, reply ? reply.fr : clean, replyIndex);
    messages = [...messages, t.learner, ...(t.partner ? [t.partner] : [])];
    nodeId = t.nextNode;
    if (t.nextNode && sc.nodes[t.nextNode].replies.length === 0) nodeId = t.nextNode;
  }
  const last = conv.messages[conv.messages.length - 1]?.at;
  const delta = last ? Math.min(120, Math.max(5, Math.round((Date.now() - new Date(last).getTime()) / 1000))) : 20;
  const row = await db.select({ s: schema.conversationSessions.activeSeconds }).from(schema.conversationSessions).where(eq(schema.conversationSessions.id, id)).get();
  await db.update(schema.conversationSessions).set({ messages, nodeId, status, mode, activeSeconds: (row?.s ?? 0) + delta, updatedAt: now(), studyDate: parisDate(date) })
    .where(eq(schema.conversationSessions.id, id)).run();
  return read(db, id);
}

/** Is the scripted conversation at a terminal node? */
export function isScriptFinished(conv: ConversationRecord): boolean {
  if (conv.mode !== "scripted" || !conv.nodeId) return false;
  const sc = getScenario(conv.scenarioId);
  return !!sc && sc.nodes[conv.nodeId]?.replies.length === 0;
}

function scriptedSummary(conv: ConversationRecord, sc: Scenario): ConversationSummary {
  const learnerMsgs = conv.messages.filter((m) => m.role === "learner");
  const corrections = learnerMsgs.filter((m) => m.correction).map((m) => m.correction!);
  const unresolved = learnerMsgs.filter((m) => m.unresolved).length;
  const endedUnclear = learnerMsgs.at(-1)?.unresolved === true;
  const finished = isScriptFinished(conv);
  const notes: string[] = [];
  if (corrections.length) notes.push(`${corrections.length} thing${corrections.length > 1 ? "s" : ""} to polish below.`);
  if (unresolved) {
    notes.push(`${unresolved} repl${unresolved === 1 ? "y wasn't" : "ies weren't"} understood and needed rephrasing${endedUnclear ? ", and the conversation ended before the last one was cleared up" : ""}.`);
  }
  if (!notes.length) notes.push("Your replies were understood and polite.");
  const needsWork = corrections.length > 0 || unresolved > 0;
  return {
    summary: `${finished ? "You completed" : "You practised"} « ${sc.title} » with ${learnerMsgs.length} repl${learnerMsgs.length === 1 ? "y" : "ies"}. ${notes.join(" ")}`,
    corrections,
    vocabulary: sc.vocabulary,
    reviewSkillIds: needsWork ? sc.skills.slice(0, 2) : [],
    encouragement: needsWork
      ? `Each slip you notice now is one you won't make in real life. ${LANG_META[langOfSkill(sc.id)].praise.wellDone}`
      : `${LANG_META[langOfSkill(sc.id)].praise.veryGood} Try it again with free typing for an extra challenge.`,
  };
}

export async function endConversation(db: DB, id: string, date: Date = new Date()): Promise<ConversationRecord> {
  const conv = await read(db, id);
  if (conv.status === "completed" && conv.summary) return conv;
  const sc = getScenario(conv.scenarioId)!;
  let summary: ConversationSummary = scriptedSummary(conv, sc);
  const provider = await allowedProvider(db);
  if (conv.mode === "ai" && provider && conv.messages.some((m) => m.role === "learner")) {
    try {
      const transcript = conv.messages.filter((m) => m.role !== "note").map((m) => `${m.role === "partner" ? "Partner" : "Learner"}: ${m.fr}`).join("\n");
      const skills = sc.skills.map((s) => `${s} (${SKILL_BY_ID[s]?.title})`).join(", ");
      summary = await askJson(provider,
        `You are a ${LANG_META[langOfSkill(sc.id)].name} teacher reviewing a learner's role-play conversation. Be encouraging and concrete. Only list real errors from the learner's lines. Reply with ONLY JSON: {"summary": "2-3 sentences in English", "corrections": [{"original": "...", "corrected": "...", "explanation": "..."}], "vocabulary": [{"fr": "...", "en": "..."}], "reviewSkillIds": ["skill ids from the list, only if relevant to errors"], "encouragement": "one sentence"}`,
        [{ role: "user", content: `Scenario: ${sc.title} — ${sc.goal}\nRelevant skill ids: ${skills}\n\nTranscript:\n${transcript}` }],
        ConversationSummarySchema, { maxTokens: 1500, timeoutMs: 40_000 });
      summary.reviewSkillIds = summary.reviewSkillIds.filter((s) => !!SKILL_BY_ID[s]);
    } catch (err) {
      console.warn("[conversation] AI summary failed, using local summary:", (err as Error).message);
    }
  }
  // Continuity: pull recommended skills forward in the review schedule.
  const today = parisDate(date);
  for (const sid of summary.reviewSkillIds) {
    await db.update(schema.reviewSchedule).set({ dueDate: today }).where(eq(schema.reviewSchedule.itemKey, `skill:${sid}`)).run();
  }
  await db.update(schema.conversationSessions).set({ status: "completed", summary, updatedAt: now() }).where(eq(schema.conversationSessions.id, id)).run();
  return read(db, id);
}

export async function explainLast(db: DB, id: string): Promise<string> {
  const conv = await read(db, id);
  const last = [...conv.messages].reverse().find((m) => m.role === "partner");
  if (!last) throw new HttpError(400, "Nothing to explain yet.");
  const provider = await allowedProvider(db);
  if (!provider || conv.mode !== "ai") {
    const sc = getScenario(conv.scenarioId)!;
    const vocab = sc.vocabulary.filter((v) => looseAnswer(last.fr).includes(looseAnswer(v.fr.split(" (")[0].replace(/\(.*\)/, "")).split(" / ")[0]));
    return `“${last.en}”${vocab.length ? `\n\nUseful here: ${vocab.map((v) => `${v.fr} = ${v.en}`).join("; ")}.` : ""}`;
  }
  const lname = LANG_META[langOfSkill(conv.scenarioId)].name;
  const res = await askJson(provider, `You are a ${lname} tutor. Explain the given ${lname} sentence to an ${conv.level} English-speaking learner in 2–4 short sentences: meaning, any key grammar point and useful words. Reply ONLY JSON: {"text": "..."}`,
    [{ role: "user", content: last.fr }], HelpSchema, { maxTokens: 500, timeoutMs: 20_000 });
  return res.text;
}

export async function getConversation(db: DB, id: string) {
  return read(db, id);
}
