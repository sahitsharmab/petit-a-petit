import {
  CORE_SUBJECTS, SUBJECT_HINT, TENSE_LABEL, agreementSuffixes, conjugate, englishClause, personIndex,
  type Subject, type Tense,
} from "@/lib/french/conjugate";
import { getVerb } from "@/lib/french/verbs";
import { toSentence } from "@/lib/french/normalize";
import type { Confusable } from "@/lib/french/evaluate";
import { bankFor } from "./bank";
import { SKILLS, getSkill } from "./curriculum";
import { FRAMES, negateComplement, type Frame } from "./frames";
import type { BankSentence, Exercise, ExerciseType, LessonSection, McqItem } from "./types";

// ───────────────────────── seeded randomness ─────────────────────────

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ───────────────────────── context ─────────────────────────

export interface GenContext {
  rng: Rng;
  section: LessonSection;
  /** Item keys to avoid (recently used). */
  avoid?: Set<string>;
  /** Exercise id prefix. */
  idPrefix: string;
  counter: { n: number };
}

function nextId(ctx: GenContext) {
  ctx.counter.n += 1;
  return `${ctx.idPrefix}-${ctx.counter.n}`;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// ───────────────────────── conjugation helpers ─────────────────────────

interface ConjChoice {
  verb: string;
  tense: Tense;
  subject: Subject;
  negative: boolean;
  frameIdx: number;
}

export function conjKey(c: Omit<ConjChoice, "frameIdx">): string {
  return `conj:${c.verb}:${c.tense}:${c.subject}${c.negative ? ":neg" : ""}`;
}

function parseConjKey(key: string): Omit<ConjChoice, "frameIdx"> | null {
  const p = key.split(":");
  if (p[0] !== "conj" || p.length < 4) return null;
  return { verb: p[1], tense: p[2] as Tense, subject: p[3] as Subject, negative: p[4] === "neg" };
}

function framesFor(verb: string): Frame[] {
  return FRAMES[verb] ?? [{ fr: "", en: "" }];
}

/** Realize a complement (agreement + negation) for a subject. */
function complementVariants(frame: Frame, subject: Subject, negative: boolean, verb: string): string[] {
  let fr = frame.fr;
  if (negative && verb !== "être" && verb !== "aimer" && verb !== "préférer") fr = negateComplement(fr);
  if (!fr.includes("{a}")) return [fr];
  return agreementSuffixes(subject).map((suf) => fr.replace("{a}", suf));
}

function chooseConj(ctx: GenContext, skillId: string): ConjChoice | null {
  const spec = getSkill(skillId).practice.conj;
  if (!spec) return null;
  const subjects = spec.subjects ?? CORE_SUBJECTS;
  for (let tries = 0; tries < 12; tries++) {
    const verb = pick(ctx.rng, spec.verbs);
    const subject = pick(ctx.rng, subjects);
    const negative = !!spec.negative && ctx.rng() < 0.7;
    const key = conjKey({ verb, tense: spec.tense, subject, negative });
    if (ctx.avoid?.has(key) && tries < 11) continue;
    return { verb, tense: spec.tense, subject, negative, frameIdx: Math.floor(ctx.rng() * framesFor(verb).length) };
  }
  return null;
}

interface BuiltSentence {
  fr: string;
  frAll: string[];
  en: string;
  predicate: string;
  predicates: string[];
  subjectDisplay: string;
  complement: string;
}

function buildSentence(c: ConjChoice): BuiltSentence {
  const conj = conjugate(c.verb, c.tense, c.subject, { negative: c.negative });
  const frame = framesFor(c.verb)[c.frameIdx] ?? framesFor(c.verb)[0];
  const comps = complementVariants(frame, c.subject, c.negative, c.verb);
  const frAll: string[] = [];
  for (const f of conj.fulls) for (const comp of comps) frAll.push(toSentence(comp ? `${f} ${comp}` : f));
  const en = toSentence(`${englishClause(c.verb, c.tense, c.subject, { negative: c.negative })}${frame.en ? " " + frame.en : ""}`);
  return {
    fr: frAll[0], frAll: [...new Set(frAll)], en,
    predicate: conj.predicate, predicates: conj.predicates,
    subjectDisplay: conj.subject, complement: comps[0],
  };
}

/** Explanation of the correct conjugation. */
export function explainConj(verbInf: string, tense: Tense, subject: Subject, negative = false): string {
  const verb = getVerb(verbInf);
  const c = conjugate(verbInf, tense, subject, { negative });
  const idx = personIndex(subject);
  const neg = negative ? " Negation wraps the conjugated verb: ne … pas." : "";
  if (tense === "present") {
    if (verb.present) return `${cap(verbInf)} is irregular: ${subject} → « ${c.full} ».${neg}`;
    const ending = verb.group === "ir" ? ["-is", "-is", "-it", "-issons", "-issez", "-issent"][idx]
      : verb.group === "re" ? ["-s", "-s", "(no ending)", "-ons", "-ez", "-ent"][idx]
      : ["-e", "-es", "-e", "-ons", "-ez", "-ent"][idx];
    const refl = verb.reflexive ? " The reflexive pronoun must match the subject." : "";
    return `Regular -${verb.group.toUpperCase()} verb: with ${subject}, the ending is ${ending} → « ${c.full} ».${refl}${neg}`;
  }
  if (tense === "passe_compose") {
    const usesEtre = verb.reflexive || verb.aux === "etre";
    const aux = usesEtre ? "être" : "avoir";
    const why = verb.reflexive ? "all reflexive verbs use être" : usesEtre ? `${verbInf} is a « House of être » verb` : "most verbs use avoir";
    const agree = usesEtre ? " With être, the participle agrees with the subject." : "";
    return `Passé composé = ${aux} + past participle (${why}). Participle of ${verbInf}: « ${verb.pp} » → « ${c.full} ».${agree}${neg}`;
  }
  return `Futur proche = aller (conjugated) + infinitive → « ${c.full} ». Only aller changes.${neg}`;
}

/** Wrong forms learners commonly produce, with targeted explanations. */
export function conjConfusables(verbInf: string, tense: Tense, subject: Subject, negative: boolean, withSubject: boolean): Confusable[] {
  const verb = getVerb(verbInf);
  const right = conjugate(verbInf, tense, subject, { negative });
  const rightSet = new Set(withSubject ? right.fulls : right.predicates);
  const out: Confusable[] = [];
  const reps: Subject[] = ["je", "tu", "il", "nous", "vous", "ils"];
  const groups: Record<string, Subject[]> = {};
  for (const s of reps) {
    const other = conjugate(verbInf, tense, s, { negative });
    const forms = withSubject ? [`${right.subject}${right.subject.endsWith("'") ? "" : " "}${other.predicate}`] : [other.predicate];
    for (const f of forms) if (!rightSet.has(f)) (groups[f] ??= []).push(s);
  }
  for (const [form, subs] of Object.entries(groups)) {
    const label = subs.map((s) => (s === "il" ? "il/elle/on" : s === "ils" ? "ils/elles" : s)).join(" / ");
    out.push({
      text: form,
      tag: "wrong-person",
      explanation: `« ${withSubject ? form.split(" ").slice(1).join(" ") || form : form} » is the ${label} form. With ${subject}, use « ${withSubject ? right.full : right.predicate} ».`,
    });
  }
  if (tense === "passe_compose") {
    const usesEtre = verb.reflexive || verb.aux === "etre";
    if (!verb.reflexive) {
      const auxWrong = getVerb(usesEtre ? "avoir" : "être").present![personIndex(subject)];
      const wrongPred = (negative ? `ne ${auxWrong} pas ${verb.pp}` : `${auxWrong} ${verb.pp}`).replace(/^ne ([aeiouéêh])/, "n'$1");
      const subj = /^[aeiouéêh]/.test(auxWrong) && subject === "je" ? "j'" : subject + " ";
      out.push({
        text: withSubject ? subj + wrongPred : wrongPred,
        tag: "auxiliary",
        explanation: usesEtre
          ? `${cap(verbInf)} is a movement/change verb: it takes être, not avoir → « ${right.full} ».`
          : `${cap(verbInf)} takes avoir, not être → « ${right.full} ».`,
      });
    }
    if (usesEtre) {
      const needs = agreementSuffixes(subject)[0];
      if (needs && !["je", "tu", "on", "vous"].includes(subject)) {
        const bare = right.predicate.replace(new RegExp(`${verb.pp}${needs}$`), verb.pp);
        out.push({
          text: withSubject ? `${right.subject} ${bare}` : bare,
          tag: "agreement",
          explanation: `With être the participle agrees with the subject: ${subject} → « ${verb.pp}${needs} ».`,
        });
      }
    }
  }
  if (tense === "futur_proche") {
    const presentPred = conjugate(verbInf, "present", subject, { negative }).predicate;
    out.push({
      text: withSubject ? `${right.subject}${right.subject.endsWith("'") ? "" : " "}${presentPred}` : presentPred,
      tag: "tense",
      explanation: `That's the present tense. Futur proche needs aller + infinitive: « ${right.full} ».`,
    });
  }
  return out;
}

function conjHint(verbInf: string, tense: Tense, subject: Subject): string {
  const verb = getVerb(verbInf);
  const c = conjugate(verbInf, tense, subject);
  if (tense === "present") {
    if (verb.present) return `${cap(verbInf)} is irregular. The answer begins with « ${c.predicate.slice(0, Math.min(3, c.predicate.length - 1))}… ».`;
    return `Find the stem of ${verbInf}, then add the ${subject} ending.`;
  }
  if (tense === "passe_compose") {
    const aux = verb.reflexive || verb.aux === "etre" ? "être" : "avoir";
    return `Use ${aux} in the present + the past participle « ${verb.pp}… ».`;
  }
  return `Conjugate aller for ${subject}, then add the infinitive.`;
}

// ───────────────────────── generators ─────────────────────────

function ruleName(skillId: string): string {
  return getSkill(skillId).title;
}

function conjExercise(ctx: GenContext, skillId: string, type: ExerciseType, choice: ConjChoice): Exercise | null {
  const { verb, tense, subject, negative } = choice;
  const key = conjKey(choice);
  const built = buildSentence(choice);
  const base = {
    id: nextId(ctx), skillId, section: ctx.section, itemKey: key, rule: ruleName(skillId), source: "local" as const,
    explanation: explainConj(verb, tense, subject, negative), hint: conjHint(verb, tense, subject),
  };
  const tenseLabel = TENSE_LABEL[tense];
  const negLabel = negative ? ", negative" : "";

  switch (type) {
    case "conjugation": {
      const pred = conjugate(verb, tense, subject, { negative });
      return {
        ...base, type,
        instruction: "Conjugate the verb",
        prompt: `${verb} → ${subject}`,
        promptNote: `${tenseLabel}${negLabel} · ${SUBJECT_HINT[subject]}`,
        accepted: [...pred.predicates, ...pred.fulls],
        confusables: [...conjConfusables(verb, tense, subject, negative, false), ...conjConfusables(verb, tense, subject, negative, true)],
        translation: toSentence(englishClause(verb, tense, subject, { negative })),
        audioText: toSentence(pred.full),
        meta: { verb, tense, subject },
      };
    }
    case "fill_blank": {
      const elided = built.subjectDisplay.endsWith("'");
      const before = cap(built.subjectDisplay);
      return {
        ...base, type,
        instruction: "Fill in the blank",
        prompt: `${before}${elided ? "" : " "}___${built.complement ? " " + built.complement : ""}.`,
        promptNote: `${verb} · ${tenseLabel}${negLabel}`,
        blank: { before: before + (elided ? "" : " "), after: (built.complement ? " " + built.complement : "") + "." },
        accepted: built.predicates,
        confusables: conjConfusables(verb, tense, subject, negative, false),
        translation: built.en,
        audioText: built.fr,
      };
    }
    case "multiple_choice": {
      const wrong = conjConfusables(verb, tense, subject, negative, true)
        .map((c) => ({ text: toSentence(c.text + (built.complement ? " " + built.complement : "")), note: c.explanation }));
      const distractors = shuffle(ctx.rng, wrong).slice(0, 2);
      if (distractors.length < 2) return null;
      const opts = shuffle(ctx.rng, [{ text: built.fr, note: base.explanation }, ...distractors]);
      return {
        ...base, type,
        instruction: "Choose the correct translation",
        prompt: `“${built.en}”`,
        promptNote: subject === "tu" || subject === "vous" ? SUBJECT_HINT[subject] : undefined,
        options: opts.map((o) => o.text),
        answerIndex: opts.findIndex((o) => o.text === built.fr),
        optionNotes: opts.map((o) => o.note),
        accepted: [built.fr],
        translation: built.en,
        audioText: built.fr,
      };
    }
    case "translation": {
      // Accept both genders/forms where English is ambiguous.
      const alt: Subject[] = subject === "nous" ? ["on"] : subject === "ils" ? ["elles"] : subject === "elles" ? ["ils"] : [];
      const extra = alt.flatMap((s) => buildSentence({ ...choice, subject: s }).frAll);
      const enSubj = subject === "tu" || subject === "vous" ? ` (${SUBJECT_HINT[subject].replace("you ", "").replace(/[()]/g, "")})` : "";
      return {
        ...base, type,
        instruction: "Translate into French",
        prompt: built.en.replace(/^(You)\b/, `$1${enSubj}`),
        accepted: [...built.frAll, ...extra],
        confusables: conjConfusables(verb, tense, subject, negative, true).map((c) => ({ ...c, text: c.text + (built.complement ? " " + built.complement : "") })),
        translation: built.en,
        audioText: built.fr,
        allowAiJudge: true,
        hint: `${base.hint} Start with « ${cap(built.subjectDisplay)}… ».`,
      };
    }
    case "listening": {
      return {
        ...base, type, mode: "dictation",
        instruction: "Type what you hear",
        prompt: "Listen and write the sentence in French.",
        audioText: built.fr,
        accepted: built.frAll,
        translation: built.en,
        hint: `It means: “${built.en}”`,
        explanation: `${base.explanation}`,
      };
    }
    case "sentence_builder": {
      const tokens = built.fr.replace(/[.!?]$/, "").split(" ");
      const wrongForm = conjConfusables(verb, tense, subject, negative, false)[0]?.text.split(" ").pop();
      const tiles = shuffle(ctx.rng, [...tokens.map(tileCase), ...(wrongForm ? [wrongForm] : [])]);
      return {
        ...base, type,
        instruction: "Build the sentence",
        prompt: built.en,
        tiles,
        accepted: built.frAll,
        translation: built.en,
        audioText: built.fr,
        hint: `Start with « ${tileCase(tokens[0])} ».`,
      };
    }
    default:
      return null;
  }
}

function tileCase(token: string): string {
  return /^(Paris|Lyon|Londres|Bordeaux|Sam|Marie|Léa|Madame|Monsieur|Versailles|France|Canada)/.test(token) ? token : token.toLowerCase();
}

function mcqExercise(ctx: GenContext, skillId: string, item: McqItem, typed: boolean): Exercise {
  const base = {
    id: nextId(ctx), skillId, section: ctx.section, itemKey: `mcq:${skillId}:${item.id}`, rule: ruleName(skillId),
    source: "local" as const, explanation: item.explanation,
    // Typed answers get a rule reminder; choices get a gentler, non-revealing nudge.
    hint: typed ? `Rule reminder: ${item.explanation}` : `Think about: ${getSkill(skillId).summary}`,
    translation: item.en,
  };
  const answer = item.options[item.answer];
  if (typed && item.prompt.includes("___")) {
    const [before, after] = item.prompt.split("___");
    const noteMatch = after.match(/\(([^)]*)\)\s*$/);
    return {
      ...base, type: "fill_blank",
      instruction: "Fill in the blank",
      prompt: item.prompt.replace(/\s*\([^)]*\)\s*$/, ""),
      promptNote: noteMatch?.[1],
      blank: { before, after: after.replace(/\s*\([^)]*\)\s*$/, "") },
      accepted: [answer],
      confusables: item.options.filter((_, i) => i !== item.answer).map((o) => ({ text: o, tag: skillId, explanation: item.explanation })),
      audioText: item.prompt.includes("___") ? item.prompt.replace("___", answer).replace(/\s*\([^)]*\)\s*$/, "") : undefined,
    };
  }
  const order = shuffle(ctx.rng, item.options.map((_, i) => i));
  return {
    ...base,
    type: item.audio ? "listening" : "multiple_choice",
    mode: item.audio ? "choice" : undefined,
    instruction: item.audio ? "Listen and answer" : item.prompt.includes("___") ? "Choose the right word" : "Choose the best answer",
    prompt: item.prompt,
    audioText: item.audio ?? (item.prompt.includes("___") ? item.prompt.replace("___", answer).replace(/\s*\([^)]*\)\s*$/, "") : undefined),
    options: order.map((i) => item.options[i]),
    answerIndex: order.indexOf(item.answer),
    accepted: [answer],
  };
}

function sentenceExercise(ctx: GenContext, skillId: string, sent: BankSentence, type: ExerciseType): Exercise | null {
  const base = {
    id: nextId(ctx), skillId, section: ctx.section, itemKey: `sent:${skillId}:${sent.id}`, rule: ruleName(skillId),
    source: "local" as const, translation: sent.en, audioText: sent.fr,
    explanation: sent.note ?? `« ${sent.fr} » — ${sent.en}`,
  };
  const words = sent.fr.replace(/\s*[.!?]$/, "").replace(/\s+([?!:;])/g, "").split(" ");
  switch (type) {
    case "translation":
      return {
        ...base, type, instruction: "Translate into French", prompt: sent.en,
        accepted: [sent.fr, ...(sent.alts ?? [])], allowAiJudge: true,
        hint: `Start with « ${words.slice(0, 2).join(" ")}… ».`,
      };
    case "sentence_builder": {
      const tiles = shuffle(ctx.rng, [...words.map(tileCase), ...(sent.distractors ?? [])]);
      return {
        ...base, type, instruction: "Build the sentence", prompt: sent.en, tiles,
        accepted: [sent.fr, ...(sent.alts ?? [])], hint: `Start with « ${tileCase(words[0])} ».`,
      };
    }
    case "listening":
      return {
        ...base, type, mode: "dictation", instruction: "Type what you hear", prompt: "Listen and write the sentence in French.",
        accepted: [sent.fr], hint: `It means: “${sent.en}”`,
      };
    default:
      return null;
  }
}

/** Cloze: blank out the most informative word of a bank sentence. */
function clozeExercise(ctx: GenContext, skillId: string, sent: BankSentence): Exercise | null {
  const clean = sent.fr.replace(/\s*([.!?])$/, "$1");
  const words = clean.split(" ");
  const candidates = words
    .map((w, i) => ({ w: w.replace(/[.,!?]$/, ""), i }))
    .filter(({ w, i }) => i > 0 && w.length >= 4 && !w.includes("'"));
  if (!candidates.length) return null;
  const target = candidates.reduce((a, b) => (b.w.length > a.w.length ? b : a));
  const before = words.slice(0, target.i).join(" ") + " ";
  const tail = words[target.i].slice(target.w.length);
  const after = tail + (target.i < words.length - 1 ? " " + words.slice(target.i + 1).join(" ") : "");
  return {
    id: nextId(ctx), skillId, section: ctx.section, itemKey: `sent:${skillId}:${sent.id}`, rule: ruleName(skillId), source: "local",
    type: "fill_blank", instruction: "Complete the sentence", prompt: `${before}___${after}`, promptNote: `“${sent.en}”`,
    blank: { before, after }, accepted: [target.w], translation: sent.en, audioText: sent.fr,
    explanation: `« ${sent.fr} » — ${sent.en}`, hint: `The missing word starts with « ${target.w.slice(0, 2)}… ».`,
  };
}

function listeningChoice(ctx: GenContext, skillId: string, sent: BankSentence, pool: BankSentence[]): Exercise | null {
  const others = shuffle(ctx.rng, pool.filter((p) => p.id !== sent.id)).slice(0, 2);
  if (others.length < 2) return null;
  const opts = shuffle(ctx.rng, [sent, ...others]);
  return {
    id: nextId(ctx), skillId, section: ctx.section, itemKey: `sent:${skillId}:${sent.id}`, rule: ruleName(skillId), source: "local",
    type: "listening", mode: "choice", instruction: "Listen and choose the meaning", prompt: "What did you hear?",
    audioText: sent.fr, options: opts.map((o) => o.en), answerIndex: opts.indexOf(sent), accepted: [sent.en],
    translation: sent.en, explanation: `You heard « ${sent.fr} » — “${sent.en}”.`, hint: "Replay it slowly and listen for the verb and the key noun.",
  };
}

function dialogueExercise(ctx: GenContext, skillId: string, id: string): Exercise | null {
  const dlg = bankFor(skillId).dialogues?.find((x) => x.id === id);
  if (!dlg) return null;
  const order = shuffle(ctx.rng, dlg.options.map((_, i) => i));
  const correct = dlg.options.findIndex((o) => o.correct);
  return {
    id: nextId(ctx), skillId, section: ctx.section, itemKey: `dlg:${skillId}:${dlg.id}`, rule: ruleName(skillId), source: "local",
    type: "dialogue", instruction: "Choose the best reply", prompt: dlg.context, lines: dlg.lines,
    audioText: dlg.lines[dlg.lines.length - 1].fr,
    options: order.map((i) => dlg.options[i].fr), answerIndex: order.indexOf(correct),
    optionNotes: order.map((i) => dlg.options[i].why),
    accepted: [dlg.options[correct].fr], translation: dlg.options[correct].en,
    explanation: dlg.options[correct].why, hint: "Think about politeness (tu or vous?) and whether the reply actually answers the question.",
  };
}

// Generated transformations -------------------------------------------------

function generatedTransform(ctx: GenContext, skillId: string, choice: ConjChoice, kind: string): Exercise | null {
  const baseChoice = { ...choice, negative: false };
  const source = buildSentence(baseChoice);
  let target: string[] = [];
  let instruction = "";
  let explanation = "";
  if (kind === "negation") {
    target = buildSentence({ ...baseChoice, negative: true }).frAll;
    instruction = "Make it negative";
    explanation = `${explainConj(choice.verb, choice.tense, choice.subject, true)} Un/une/des/du become de after a negative verb.`;
  } else if (kind === "passe_compose") {
    if (choice.tense !== "passe_compose") return null;
    const present = buildSentence({ ...baseChoice, tense: "present" });
    target = buildSentence(baseChoice).frAll;
    instruction = "Rewrite in the passé composé";
    return {
      id: nextId(ctx), skillId, section: ctx.section, type: "transformation", itemKey: conjKey(baseChoice), rule: ruleName(skillId), source: "local",
      instruction, prompt: present.fr, promptNote: "présent → passé composé", accepted: target,
      confusables: conjConfusables(choice.verb, "passe_compose", choice.subject, false, true).map((c) => ({ ...c, text: c.text + (present.complement ? " " + present.complement : "") })),
      translation: source.en, audioText: target[0], hint: conjHint(choice.verb, "passe_compose", choice.subject),
      explanation: explainConj(choice.verb, "passe_compose", choice.subject),
    };
  } else if (kind === "futur_proche") {
    if (choice.tense !== "futur_proche") return null;
    const present = buildSentence({ ...baseChoice, tense: "present" });
    return {
      id: nextId(ctx), skillId, section: ctx.section, type: "transformation", itemKey: conjKey(baseChoice), rule: ruleName(skillId), source: "local",
      instruction: "Rewrite in the futur proche", prompt: present.fr, promptNote: "présent → futur proche", accepted: source.frAll,
      translation: source.en, audioText: source.fr, hint: conjHint(choice.verb, "futur_proche", choice.subject),
      explanation: explainConj(choice.verb, "futur_proche", choice.subject),
      confusables: conjConfusables(choice.verb, "futur_proche", choice.subject, false, true),
    };
  } else if (kind === "question") {
    if (choice.subject === "je" || getVerb(choice.verb).reflexive) return null;
    const stmt = source.fr.replace(/\.$/, "");
    const body = stmt[0].toLowerCase() + stmt.slice(1);
    const estce = /^[aeiouéèêh]/i.test(body) ? `Est-ce qu'${body} ?` : `Est-ce que ${body} ?`;
    const pred = conjugate(choice.verb, "present", choice.subject).predicate;
    const needsT = /[ae]$/.test(pred) && ["il", "elle", "on"].includes(choice.subject);
    const inv = `${cap(pred)}-${needsT ? "t-" : ""}${choice.subject}${source.complement ? " " + source.complement : ""} ?`;
    target = [estce, `${stmt} ?`, inv];
    instruction = "Turn it into a question";
    explanation = `Three correct options: intonation (« ${stmt} ? »), est-ce que (« ${estce} ») or inversion (« ${inv} »).`;
  } else return null;
  return {
    id: nextId(ctx), skillId, section: ctx.section, type: "transformation", itemKey: `gtr:${kind}:${conjKey(baseChoice)}`,
    rule: ruleName(skillId), source: "local", instruction, prompt: source.fr, accepted: target,
    translation: source.en, audioText: target[0], explanation,
    hint: kind === "negation" ? "Put ne before the verb and pas right after it (n' before a vowel)." : "Try starting with « Est-ce que… ».",
  };
}

// ───────────────────────── public API ─────────────────────────

/** Generate one exercise of the requested type for a skill, or null if impossible. */
export function generateExercise(ctx: GenContext, skillId: string, type: ExerciseType): Exercise | null {
  const skill = getSkill(skillId);
  if (skill.practice.includeSkills?.length) {
    const sub = pick(ctx.rng, skill.practice.includeSkills);
    const own = bankFor(skillId);
    // Review skills mix their own bank (if any) with included skills.
    if ((own.sentences?.length || own.mcq?.length || own.dialogues?.length) && ctx.rng() < 0.5) {
      const ex = generateOwn(ctx, skillId, type);
      if (ex) return ex;
    }
    const ex = generateOwn(ctx, sub, type) ?? generateOwn(ctx, sub, pick(ctx.rng, getSkill(sub).practice.types));
    if (ex) ex.meta = { ...ex.meta, parentSkill: skillId };
    return ex;
  }
  return generateOwn(ctx, skillId, type);
}

function fresh<T extends { id: string }>(ctx: GenContext, items: T[] | undefined, keyFn: (i: T) => string): T | undefined {
  if (!items?.length) return undefined;
  const unused = items.filter((i) => !ctx.avoid?.has(keyFn(i)));
  return pick(ctx.rng, unused.length ? unused : items);
}

function generateOwn(ctx: GenContext, skillId: string, type: ExerciseType): Exercise | null {
  const skill = getSkill(skillId);
  const bank = bankFor(skillId);
  const spec = skill.practice;
  const conj = spec.conj ? chooseConj(ctx, skillId) : null;
  const sentence = fresh(ctx, bank.sentences, (s) => `sent:${skillId}:${s.id}`);
  const preferBank = ctx.rng() < 0.45;

  switch (type) {
    case "conjugation":
      return conj ? conjExercise(ctx, skillId, type, conj) : null;
    case "fill_blank": {
      const typeable = bank.mcq?.filter((q) => q.typeable);
      const q = fresh(ctx, typeable, (i) => `mcq:${skillId}:${i.id}`);
      if (q && (preferBank || !conj)) return mcqExercise(ctx, skillId, q, true);
      if (conj) return conjExercise(ctx, skillId, type, conj);
      if (q) return mcqExercise(ctx, skillId, q, true);
      return sentence ? clozeExercise(ctx, skillId, sentence) : null;
    }
    case "multiple_choice": {
      const q = fresh(ctx, bank.mcq?.filter((x) => !x.audio), (i) => `mcq:${skillId}:${i.id}`);
      if (q && (preferBank || !conj)) return mcqExercise(ctx, skillId, q, false);
      if (conj) return conjExercise(ctx, skillId, type, conj) ?? (q ? mcqExercise(ctx, skillId, q, false) : null);
      return q ? mcqExercise(ctx, skillId, q, false) : null;
    }
    case "translation":
      if (sentence && (preferBank || !conj)) return sentenceExercise(ctx, skillId, sentence, type);
      return conj ? conjExercise(ctx, skillId, type, conj) : sentence ? sentenceExercise(ctx, skillId, sentence, type) : null;
    case "sentence_builder":
      if (sentence) return sentenceExercise(ctx, skillId, sentence, type);
      return conj ? conjExercise(ctx, skillId, type, conj) : null;
    case "listening": {
      const audioQ = fresh(ctx, bank.mcq?.filter((x) => x.audio), (i) => `mcq:${skillId}:${i.id}`);
      if (audioQ && ctx.rng() < 0.5) return mcqExercise(ctx, skillId, audioQ, false);
      if (sentence && bank.sentences && bank.sentences.length >= 3 && ctx.rng() < 0.35) return listeningChoice(ctx, skillId, sentence, bank.sentences);
      if (sentence && (preferBank || !conj)) return sentenceExercise(ctx, skillId, sentence, type);
      return conj ? conjExercise(ctx, skillId, type, conj) : null;
    }
    case "transformation": {
      const tr = fresh(ctx, bank.transforms, (i) => `tr:${skillId}:${i.id}`);
      if (tr && (preferBank || !conj || !spec.transform)) return transformFromBank(ctx, skillId, tr.id);
      if (conj && spec.transform) return generatedTransform(ctx, skillId, conj, spec.transform) ?? (tr ? transformFromBank(ctx, skillId, tr.id) : null);
      return tr ? transformFromBank(ctx, skillId, tr.id) : null;
    }
    case "dialogue": {
      const dlg = fresh(ctx, bank.dialogues, (i) => `dlg:${skillId}:${i.id}`);
      return dlg ? dialogueExercise(ctx, skillId, dlg.id) : null;
    }
  }
}

function transformFromBank(ctx: GenContext, skillId: string, id: string): Exercise | null {
  const tr = bankFor(skillId).transforms?.find((x) => x.id === id);
  if (!tr) return null;
  return {
    id: nextId(ctx), skillId, section: ctx.section, type: "transformation", itemKey: `tr:${skillId}:${tr.id}`,
    rule: ruleName(skillId), source: "local", instruction: `Transform: ${tr.kind}`, prompt: tr.from, accepted: tr.to,
    explanation: tr.explanation, hint: getSkill(skillId).tip ?? getSkill(skillId).summary, audioText: tr.to[0],
  };
}

/**
 * Rebuild an exercise targeting a specific review item (spaced repetition).
 * The exercise type rotates so reviews aren't identical to the original.
 */
export function exerciseForItem(ctx: GenContext, itemKey: string): Exercise | null {
  const [kind] = itemKey.split(":");
  if (kind === "conj") {
    const c = parseConjKey(itemKey);
    if (!c) return null;
    const skillId = skillForConj(c.verb, c.tense, c.negative);
    if (!skillId) return null;
    const choice = { ...c, frameIdx: Math.floor(ctx.rng() * framesFor(c.verb).length) };
    const type = pick(ctx.rng, ["fill_blank", "conjugation", "multiple_choice", "translation"] as ExerciseType[]);
    return conjExercise(ctx, skillId, type, choice) ?? conjExercise(ctx, skillId, "conjugation", choice);
  }
  if (kind === "gtr") {
    const [, trKind, ...rest] = itemKey.split(":");
    const c = parseConjKey(rest.join(":"));
    if (!c) return null;
    const skillId = skillForConj(c.verb, c.tense, false, trKind);
    return skillId ? generatedTransform(ctx, skillId, { ...c, frameIdx: 0 }, trKind) : null;
  }
  const [, skillId, id] = itemKey.split(":");
  if (!skillId || !id) return null;
  try { getSkill(skillId); } catch { return null; }
  const bank = bankFor(skillId);
  if (kind === "mcq") {
    const q = bank.mcq?.find((x) => x.id === id);
    if (!q) return null;
    return mcqExercise(ctx, skillId, q, !!q.typeable && !q.audio && ctx.rng() < 0.5);
  }
  if (kind === "sent") {
    const sent = bank.sentences?.find((x) => x.id === id);
    if (!sent) return null;
    return sentenceExercise(ctx, skillId, sent, pick(ctx.rng, ["translation", "sentence_builder", "listening"] as ExerciseType[]));
  }
  if (kind === "tr") return transformFromBank(ctx, skillId, id);
  if (kind === "dlg") return dialogueExercise(ctx, skillId, id);
  return null;
}

/** Find the skill that drills a verb/tense combination. */
export function skillForConj(verb: string, tense: Tense, negative: boolean, transform?: string): string | null {
  const candidates = SKILLS.filter((s) => s.practice.conj && s.practice.conj.tense === tense && s.practice.conj.verbs.includes(verb));
  const exact = candidates.find((s) => (transform ? s.practice.transform === transform : !!s.practice.conj!.negative === negative));
  return (exact ?? candidates[0])?.id ?? null;
}
