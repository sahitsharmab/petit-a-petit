/**
 * Text normalization for comparing learner answers with expected French.
 *
 * Normalization is deliberately forgiving about things that do not change the
 * French itself (case, spacing, curly vs straight apostrophes, final
 * punctuation, French typographic spaces before ? ! : ;) and strict about
 * everything else (letters, accents, word order unless alternatives exist).
 */

const APOSTROPHES = /[‘’ʼ`´′]/g;
const DASHES = /[‐‑‒–—−]/g;
const SPACES = /[\s    ]+/g;

/** Unicode-normalize (NFC) and unify look-alike characters. */
export function canonicalChars(input: string): string {
  return input.normalize("NFC").replace(APOSTROPHES, "'").replace(DASHES, "-").replace(SPACES, " ");
}

/** Normalize an answer for strict comparison (accents preserved). */
export function normalizeAnswer(input: string): string {
  return canonicalChars(input)
    .toLowerCase()
    .replace(/[«»"“”„]/g, "")
    .replace(/\s*'\s*/g, "'") // "j' aime" -> "j'aime"
    .replace(/\s*-\s*/g, "-") // "parles - tu" -> "parles-tu"
    .replace(/[.!?…,;:¿¡]+/g, " ") // punctuation is never graded
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove diacritics: "élève" -> "eleve", "cœur" -> "coeur". */
export function stripAccents(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFC");
}

/** Normalized form ignoring accents (used to detect accent-only mistakes). */
export function looseAnswer(input: string): string {
  return stripAccents(normalizeAnswer(input));
}

/** Split normalized text into word tokens (apostrophe kept with elided word). */
export function tokenize(input: string): string[] {
  const norm = normalizeAnswer(input);
  if (!norm) return [];
  // "j'aime" -> ["j'", "aime"], "parles-tu" -> ["parles", "-tu"]
  return norm
    .split(" ")
    .flatMap((w) => w.split(/(?<=')/))
    .flatMap((w) => w.split(/(?<!-t)(?=-(?:t-)?(?:je|tu|il|elle|on|nous|vous|ils|elles|moi|toi|le|la|les|lui|leur|y|en)\b)/))
    .filter(Boolean);
}

/** Classic Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Expand a compact answer pattern into every accepted string.
 *  - "[a|b]" alternatives, "(x)" optional segment.
 *  e.g. "[Je m'appelle|Mon nom est] Paul" -> 2 strings
 *       "Il fait (très) beau" -> ["Il fait très beau", "Il fait beau"]
 */
export function expandPattern(pattern: string, limit = 64): string[] {
  const m = pattern.match(/\[([^\[\]]*)\]|\(([^()]*)\)/);
  if (!m || m.index === undefined) return [pattern.replace(/\s+/g, " ").trim()];
  const before = pattern.slice(0, m.index);
  const after = pattern.slice(m.index + m[0].length);
  const options = m[1] !== undefined ? m[1].split("|") : [m[2], ""];
  const out = new Set<string>();
  for (const opt of options) {
    for (const rest of expandPattern(before + opt + after, limit)) {
      out.add(rest);
      if (out.size >= limit) return [...out];
    }
  }
  return [...out];
}

export function expandAll(patterns: string[]): string[] {
  return [...new Set(patterns.flatMap((p) => expandPattern(p)))];
}

/** Capitalize the first letter and ensure end punctuation for display. */
export function toSentence(s: string, end = "."): string {
  const t = s.trim();
  if (!t) return t;
  const cap = t[0].toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(cap) ? cap : cap + end;
}
