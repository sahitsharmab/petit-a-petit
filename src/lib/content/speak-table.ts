/**
 * What a cell of a lesson-intro table should say aloud, or null when it isn't in the course language
 * (English labels, notes, endings like "-e"). Conjugated forms are said with their pronoun ("je peux",
 * "nous pouvons"), taken from the row label or the column header.
 */
const PRONOUN = /^(je|j'|tu|il|elle|on|nous|vous|ils|elles|ich|du|er|es|sie|wir|ihr)(\s*\/.*)?$/i;
const NOT_SPOKEN = /^(english|notes?|ending|pattern|change|subject)$/i;
const FIRST_COL_SPOKEN = /^(french|german|infinitive|masculine)$/i;

export function spokenCell(headers: string[], row: string[], c: number): string | null {
  const header = (headers[c] ?? "").trim();
  if (NOT_SPOKEN.test(header) || (c === 0 && !FIRST_COL_SPOKEN.test(header))) return null;
  const text = row[c].replace(/\(.*?\)/g, "").replace(/\s+\/\s+/g, ", ").replace(/\s+/g, " ").trim();
  if (!/\p{L}/u.test(text)) return null;
  const label = PRONOUN.test(row[0]?.trim() ?? "") ? row[0] : PRONOUN.test(header) && c > 0 ? header : null;
  // Not for the pronoun columns themselves, or text that already starts with one ("je me lève").
  if (!label || c === 0 || /pronoun/i.test(header) || PRONOUN.test(text.split(" ")[0])) return text;
  const subject = label.split("/")[0].trim();
  if (subject.endsWith("'") || (/^je$/i.test(subject) && /^[aeiouéèêh]/i.test(text))) return `j'${text}`;
  return `${subject} ${text}`;
}
