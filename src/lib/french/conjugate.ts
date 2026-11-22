import { getVerb, type VerbDef } from "./verbs";

export type Subject = "je" | "tu" | "il" | "elle" | "on" | "nous" | "vous" | "ils" | "elles";
export type Tense = "present" | "passe_compose" | "futur_proche";

export const SUBJECTS: Subject[] = ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"];
/** Subjects used by default in drills (on is introduced later). */
export const CORE_SUBJECTS: Subject[] = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"];

export const TENSE_LABEL: Record<Tense, string> = {
  present: "présent",
  passe_compose: "passé composé",
  futur_proche: "futur proche",
};

export function personIndex(s: Subject): number {
  switch (s) {
    case "je": return 0;
    case "tu": return 1;
    case "il": case "elle": case "on": return 2;
    case "nous": return 3;
    case "vous": return 4;
    case "ils": case "elles": return 5;
  }
}

const ASPIRATED_H = ["haut", "héros", "hibou", "honte", "hors", "huit", "hasard", "hâte", "haricot"];

export function startsWithVowelSound(word: string): boolean {
  const w = word.toLowerCase();
  if (/^[aeiouyàâäéèêëîïôöûùüœæ]/.test(w)) return true;
  if (w.startsWith("h")) return !ASPIRATED_H.some((a) => w.startsWith(a));
  return false;
}

const ELIDABLE = new Set(["je", "me", "te", "se", "ne", "le", "la", "de", "que"]);

/** Join words applying French elision (je aime -> j'aime, ne est -> n'est). */
export function joinWithElision(words: string[]): string {
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    if (next && ELIDABLE.has(w.toLowerCase()) && startsWithVowelSound(next)) {
      out.push(w.slice(0, -1) + "'");
    } else {
      out.push(w);
    }
  }
  return out.join(" ").replace(/' /g, "'");
}

export function baseInfinitive(verb: VerbDef): string {
  return verb.inf.replace(/^se /, "").replace(/^s'/, "");
}

/** All accepted present-tense forms of the bare verb for a person index. */
export function presentForms(verb: VerbDef, idx: number): string[] {
  if (verb.present) {
    return [verb.present[idx], ...(verb.presentAlt?.[idx] ?? [])];
  }
  const base = baseInfinitive(verb);
  let stem = base.slice(0, -2);
  if (verb.group === "ir") return [stem + ["is", "is", "it", "issons", "issez", "issent"][idx]];
  if (verb.group === "re") return [stem + ["s", "s", "", "ons", "ez", "ent"][idx]];

  const endings = ["e", "es", "e", "ons", "ez", "ent"];
  const boot = idx !== 3 && idx !== 4;
  const forms: string[] = [];
  if (idx === 3) {
    if (stem.endsWith("g")) stem += "e";
    else if (stem.endsWith("c")) stem = stem.slice(0, -1) + "ç";
  }
  if (boot && verb.stemChange) {
    switch (verb.stemChange) {
      case "e-grave": {
        const i = stem.lastIndexOf("e");
        forms.push(stem.slice(0, i) + "è" + stem.slice(i + 1) + endings[idx]);
        break;
      }
      case "e-acute-grave": {
        const i = stem.lastIndexOf("é");
        forms.push(stem.slice(0, i) + "è" + stem.slice(i + 1) + endings[idx]);
        break;
      }
      case "double-l":
        forms.push(stem + "l" + endings[idx]);
        break;
      case "y-i":
        forms.push(stem.slice(0, -1) + "i" + endings[idx], stem + endings[idx]);
        break;
    }
    return forms;
  }
  return [stem + endings[idx]];
}

const REFLEXIVE = ["me", "te", "se", "nous", "vous", "se"];

/** Past participle agreement suffixes (canonical first) for être verbs. */
export function agreementSuffixes(subject: Subject): string[] {
  switch (subject) {
    case "je": case "tu": return ["", "e"];
    case "il": return [""];
    case "elle": return ["e"];
    case "on": return ["", "s", "e", "es"];
    case "nous": return ["s", "es"];
    case "vous": return ["s", "es", "", "e"];
    case "ils": return ["s"];
    case "elles": return ["es"];
  }
}

export interface ConjugateOptions {
  negative?: boolean;
}

export interface Conjugation {
  /** Displayed subject, possibly elided ("j'"). */
  subject: string;
  /** Everything after the subject, canonical form ("ne parle pas"). */
  predicate: string;
  /** All accepted predicates (canonical first). */
  predicates: string[];
  /** Full clause, canonical ("je ne parle pas"). */
  full: string;
  /** All accepted full clauses. */
  fulls: string[];
}

function wordsFor(verb: VerbDef, tense: Tense, subject: Subject, opts: ConjugateOptions, form: string, agreement: string): string[] {
  const idx = personIndex(subject);
  const refl = verb.reflexive ? [REFLEXIVE[idx]] : [];
  const neg = opts.negative;
  if (tense === "present") {
    return [subject, ...(neg ? ["ne"] : []), ...refl, form, ...(neg ? ["pas"] : [])];
  }
  if (tense === "passe_compose") {
    const auxVerb = getVerb(verb.reflexive || verb.aux === "etre" ? "être" : "avoir");
    const aux = auxVerb.present![idx];
    const pp = verb.reflexive || verb.aux === "etre" ? verb.pp + agreement : verb.pp;
    return [subject, ...(neg ? ["ne"] : []), ...refl, aux, ...(neg ? ["pas"] : []), pp];
  }
  // futur proche: aller + infinitive (reflexive pronoun agrees with subject)
  const aller = getVerb("aller").present![idx];
  return [subject, ...(neg ? ["ne"] : []), aller, ...(neg ? ["pas"] : []), ...refl, baseInfinitive(verb)];
}

export function conjugate(inf: string, tense: Tense, subject: Subject, opts: ConjugateOptions = {}): Conjugation {
  const verb = getVerb(inf);
  const idx = personIndex(subject);
  const forms = tense === "present" ? presentForms(verb, idx) : [""];
  const agreements = tense === "passe_compose" && (verb.reflexive || verb.aux === "etre") ? agreementSuffixes(subject) : [""];
  const fulls: string[] = [];
  for (const f of forms) for (const a of agreements) fulls.push(joinWithElision(wordsFor(verb, tense, subject, opts, f, a)));
  const unique = [...new Set(fulls)];
  const split = (full: string) => {
    const m = full.match(/^(j'|je |tu |il |elle |on |nous |vous |ils |elles )/)!;
    return { subject: m[1].trim(), predicate: full.slice(m[1].length) };
  };
  const first = split(unique[0]);
  return {
    subject: first.subject,
    predicate: first.predicate,
    predicates: unique.map((f) => split(f).predicate),
    full: unique[0],
    fulls: unique,
  };
}

/** Every present-tense form of a verb, by person index (for distractors / mistake detection). */
export function allPredicates(inf: string, tense: Tense, opts: ConjugateOptions = {}): { subject: Subject; predicate: string }[] {
  const reps: Subject[] = ["je", "tu", "il", "nous", "vous", "ils"];
  return reps.map((s) => ({ subject: s, predicate: conjugate(inf, tense, s, opts).predicate }));
}

// ---------------------------------------------------------------------------
// English rendering (for prompts like "Translate: we speak French")
// ---------------------------------------------------------------------------

const EN_PRONOUN: Record<Subject, string> = {
  je: "I", tu: "you", il: "he", elle: "she", on: "we", nous: "we", vous: "you", ils: "they", elles: "they",
};

export const SUBJECT_HINT: Record<Subject, string> = {
  je: "I",
  tu: "you (informal)",
  il: "he",
  elle: "she",
  on: "we (informal 'on')",
  nous: "we",
  vous: "you (formal / plural)",
  ils: "they (masc. / mixed)",
  elles: "they (fem.)",
};

function thirdSingular(word: string): string {
  if (word === "have") return "has";
  if (word === "do") return "does";
  if (word === "go") return "goes";
  if (/(s|sh|ch|x|z|o)$/.test(word)) return word + "es";
  if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + "ies";
  return word + "s";
}

function beForm(subject: Subject, past: boolean): string {
  const third = subject === "il" || subject === "elle";
  if (past) return subject === "je" || third ? "was" : "were";
  if (subject === "je") return "am";
  return third ? "is" : "are";
}

export function englishClause(inf: string, tense: Tense, subject: Subject, opts: ConjugateOptions = {}): string {
  const verb = getVerb(inf);
  const pron = EN_PRONOUN[subject];
  const third = subject === "il" || subject === "elle";
  const [head, ...rest] = verb.en.split(" ");
  const tail = rest.length ? " " + rest.join(" ") : "";
  const neg = opts.negative;

  if (tense === "futur_proche") {
    const base = verb.enModal ? "be able to" : verb.en;
    return `${pron} ${beForm(subject, false)}${neg ? " not" : ""} going to ${base}`;
  }
  if (tense === "passe_compose") {
    if (head === "be") return `${pron} ${beForm(subject, true)}${neg ? " not" : ""}${tail}`;
    if (neg) return `${pron} didn't ${verb.enModal ? "manage to" : verb.en}`;
    return `${pron} ${verb.enPast}`;
  }
  // present
  if (head === "be") return `${pron} ${beForm(subject, false)}${neg ? " not" : ""}${tail}`;
  if (verb.enModal) return `${pron} ${neg ? "cannot" : head}${tail}`;
  if (neg) return `${pron} ${third ? "doesn't" : "don't"} ${verb.en}`;
  return `${pron} ${third ? thirdSingular(head) : head}${tail}`;
}
