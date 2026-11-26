import { describe, expect, it } from "vitest";
import { spokenCell } from "@/lib/content/speak-table";
import { courseSkills } from "@/lib/content/curriculum";

const said = (headers: string[], rows: string[][]) => rows.map((row) => row.map((_, c) => spokenCell(headers, row, c)));

describe("intro table audio", () => {
  it("every conjugated form gets a speaker, said with its pronoun", () => {
    expect(said(["", "pouvoir", "vouloir", "devoir"], [["je", "peux", "veux", "dois"], ["il/elle/on", "peut", "veut", "doit"], ["ils/elles", "peuvent", "veulent", "doivent"]])).toEqual([
      [null, "je peux", "je veux", "je dois"], [null, "il peut", "il veut", "il doit"], [null, "ils peuvent", "ils veulent", "ils doivent"],
    ]);
    expect(said(["Subject", "Ending", "parler"], [["j'", "-e", "aime"], ["je", "-e", "parle"]])).toEqual([[null, null, "j'aime"], [null, null, "je parle"]]);
    expect(said(["", "je", "nous", "ils"], [["savoir", "sais", "savons", "savent"]])).toEqual([[null, "je sais", "nous savons", "ils savent"]]);
    expect(said(["change", "infinitive", "du", "er / sie / es"], [["a → ä", "fahren", "fährst", "fährt"]])).toEqual([[null, "fahren", "du fährst", "er fährt"]]);
  });

  it("English labels, notes and endings stay silent; full phrases are said as written", () => {
    expect(said(["French", "English", "Notes"], [["je (j')", "I", "becomes j' before a vowel"], ["tu", "you", ""]])).toEqual([["je", null, null], ["tu", null, null]]);
    expect(said(["", "aller"], [["elle", "est allée"]])).toEqual([[null, "elle est allée"]]);
    expect(said(["", "masculine", "feminine", "plural"], [["the", "le (l')", "la (l')", "les"]])).toEqual([[null, "le", "la", "les"]]);
    expect(said(["Subject", "pronoun", "se lever"], [["je", "me (m')", "je me lève"]])).toEqual([[null, "me", "je me lève"]]);
    expect(said(["", "masc.", "fem.", "neuter", "plural"], [["nominative", "der / ein", "die / eine", "das / ein", "die"], ["a", "ein", "eine", "ein", "—"]]))
      .toEqual([[null, "der, ein", "die, eine", "das, ein", "die"], [null, "ein", "eine", "ein", null]]);
  });

  it("every course-language column of every real table can be heard", () => {
    for (const lang of ["fr", "de"] as const) for (const s of courseSkills(lang)) {
      for (const sec of (s as { explanation?: { table?: { headers: string[]; rows: string[][] } }[] }).explanation ?? []) {
        if (!sec.table) continue;
        const { headers, rows } = sec.table;
        for (let c = 1; c < headers.length; c++) {
          if (/^(english|notes?|ending|pattern|change)$/i.test(headers[c])) continue;
          expect(rows.some((row) => spokenCell(headers, row, c)), `${s.id} column "${headers[c]}"`).toBe(true);
        }
      }
    }
  });
});
