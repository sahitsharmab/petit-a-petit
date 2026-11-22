import { canonicalChars, expandAll, levenshtein, looseAnswer, normalizeAnswer, tokenize } from "./normalize";
import { joinWithElision } from "./conjugate";
import type { Lang } from "@/lib/content/languages";

export type Verdict = "correct" | "almost" | "incorrect";

export interface Confusable {
  /** A specific wrong answer learners commonly give. */
  text: string;
  /** Mistake category, e.g. "wrong-person", "gender", "auxiliary". */
  tag: string;
  /** Teacher explanation shown when this mistake is detected. */
  explanation: string;
}

export interface EvaluateInput {
  answer: string;
  /** Accepted answers; may use [a|b] and (optional) patterns. */
  accepted: string[];
  confusables?: Confusable[];
  /** Tag applied to unclassified wrong answers. */
  defaultTag?: string;
  /**
   * For transformations: the original sentence. Returning it unchanged is never a transformation,
   * except an intonation question, which must then actually end with « ? ».
   */
  unchangedFrom?: string;
  /** Course language (default French): picks the accent, elision and negation rules. */
  lang?: Lang;
}

export interface Mark {
  token: string;
  ok: boolean;
}

export interface EvaluateResult {
  verdict: Verdict;
  /** Canonical correct answer to show. */
  expected: string;
  /** The accepted answer closest to the learner's attempt. */
  closest: string;
  mistakeTag?: string;
  /** Specific explanation for detected mistakes. */
  note?: string;
  answerMarks?: Mark[];
  expectedMarks?: Mark[];
}

/** LCS-based token alignment, marking tokens that do not align. */
export function diffTokens(answer: string, expected: string): { answerMarks: Mark[]; expectedMarks: Mark[] } {
  const a = tokenize(answer);
  const b = tokenize(expected);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const aOk = new Array(a.length).fill(false);
  const bOk = new Array(b.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      aOk[i] = bOk[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return {
    answerMarks: a.map((token, k) => ({ token, ok: aOk[k] })),
    expectedMarks: b.map((token, k) => ({ token, ok: bOk[k] })),
  };
}

function fixElision(answer: string): string {
  return joinWithElision(normalizeAnswer(answer).split(" "));
}

/** Loose German form: no umlaut marks, ß = ss, and ae/oe/ue accepted for ä/ö/ü. */
export function germanLoose(input: string): string {
  return looseAnswer(normalizeAnswer(input).replace(/ß/g, "ss").replace(/([aou])e/g, "$1"));
}

export function evaluateAnswer(input: EvaluateInput): EvaluateResult {
  const accepted = expandAll(input.accepted);
  const expected = accepted[0] ?? "";
  const answer = normalizeAnswer(input.answer);
  const acceptedNorm = accepted.map(normalizeAnswer);

  if (!answer) {
    return { verdict: "incorrect", expected, closest: expected, mistakeTag: "blank", note: "No answer given." };
  }

  // Punctuation is normally ignored, but for a transformation the unchanged sentence only
  // counts as an intonation question when it is written with « ? ».
  if (input.unchangedFrom !== undefined && answer === normalizeAnswer(input.unchangedFrom)) {
    const intonationIdx = accepted.findIndex((a) => /\?\s*$/.test(a.trim()) && normalizeAnswer(a) === answer);
    if (intonationIdx >= 0 && /\?\s*$/.test(canonicalChars(input.answer).trim())) {
      return { verdict: "correct", expected, closest: accepted[intonationIdx] };
    }
    return {
      verdict: "incorrect", expected, closest: intonationIdx >= 0 ? accepted[intonationIdx] : expected, mistakeTag: "unchanged",
      note: intonationIdx >= 0
        ? input.lang === "de"
          ? "Without « ? » this is still the statement. Add a question mark, or put the verb first."
          : "Without « ? » this is still the statement. Add a question mark, or use est-ce que or inversion."
        : "That's the original sentence. It still needs to be transformed.",
    };
  }

  const exactIdx = acceptedNorm.indexOf(answer);
  if (exactIdx >= 0) return { verdict: "correct", expected, closest: accepted[exactIdx] };

  // Known mistakes take priority over lenient matching.
  for (const c of input.confusables ?? []) {
    if (normalizeAnswer(c.text) === answer) {
      return {
        verdict: "incorrect",
        expected,
        closest: expected,
        mistakeTag: c.tag,
        note: c.explanation,
        ...diffTokens(input.answer, expected),
      };
    }
  }

  // Accent-only difference: right word, wrong/missing accent (German: umlauts and ß, also typed as ae/oe/ue/ss).
  const de = input.lang === "de";
  const looseOf = de ? germanLoose : looseAnswer;
  const loose = looseOf(answer);
  const looseIdx = acceptedNorm.findIndex((a) => looseOf(a) === loose);
  if (looseIdx >= 0) {
    return {
      verdict: "almost",
      expected,
      closest: accepted[looseIdx],
      mistakeTag: de ? "umlauts" : "accents",
      note: de
        ? `Almost perfect — just watch the umlauts and ß: « ${accepted[looseIdx]} ».`
        : `Almost perfect — just watch the accents: « ${accepted[looseIdx]} ».`,
      ...diffTokens(input.answer, accepted[looseIdx]),
    };
  }

  // Missing elision: "je aime" -> "j'aime".
  const elided = de ? answer : fixElision(answer);
  const elisionIdx = acceptedNorm.indexOf(elided);
  if (elided !== answer && elisionIdx >= 0) {
    return {
      verdict: "almost",
      expected,
      closest: accepted[elisionIdx],
      mistakeTag: "elision",
      note: `Remember elision: before a vowel or silent h, je/me/te/se/ne/le/la/de drop their final vowel — « ${accepted[elisionIdx]} ».`,
      ...diffTokens(input.answer, accepted[elisionIdx]),
    };
  }

  // Wrong: find the closest accepted answer for a useful correction.
  let closest = accepted[0] ?? "";
  let best = Infinity;
  for (let k = 0; k < accepted.length; k++) {
    const d = levenshtein(answer, acceptedNorm[k]);
    if (d < best) {
      best = d;
      closest = accepted[k];
    }
  }
  const tokens = tokenize(answer);
  const closestTokens = tokenize(closest);
  let tag = input.defaultTag ?? "incorrect";
  let note: string | undefined;
  const hasNe = (t: string[]) => t.includes("ne") || t.includes("n'");
  const isNeg = (t: string[]) => t.some((w) => w === "nicht" || /^kein(e|en|em|er|es)?$/.test(w));
  if (de) {
    if (isNeg(closestTokens) && !isNeg(tokens)) {
      tag = "negation";
      note = "German negates with nicht (verbs, adjectives, names, der/die/das nouns) or kein (nouns with ein or no article).";
    }
  } else if (closestTokens.includes("pas") && hasNe(closestTokens) && !(tokens.includes("pas") && hasNe(tokens))) {
    tag = "negation";
    note = "French negation wraps the verb with two parts: ne … pas (n' before a vowel).";
  }
  return { verdict: "incorrect", expected, closest, mistakeTag: tag, note, ...diffTokens(input.answer, closest) };
}
