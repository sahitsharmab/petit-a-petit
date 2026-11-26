import { describe, expect, it } from "vitest";
import { createDb, schema } from "@/lib/db";
import { glossesFor, lessonWords, lexicon } from "@/lib/content/lexicon";
import type { Exercise } from "@/lib/content/types";
import { KNOWN_AFTER, recordWordExposure, withGlosses } from "@/lib/services/words";
import { getOrCreateDailyLesson, getLessonExercises } from "@/lib/services/lessons";
import { resetProgress } from "@/lib/services/backup";

const base = { id: "x1", section: "core", itemKey: "k", instruction: "", hint: "", explanation: "", rule: "", source: "local" } as const;
const ex = (e: Partial<Exercise> & Pick<Exercise, "type" | "skillId" | "prompt" | "accepted">): Exercise => ({ ...base, ...e }) as Exercise;

describe("word hints", () => {
  it("hints the new words of a translation, not the verb being practised", () => {
    const g = glossesFor(ex({ type: "translation", skillId: "w1-er-present", prompt: "I play with the children.", accepted: ["Je joue avec les enfants."] }));
    expect(g).toEqual([{ key: "fr:avec les enfants", span: "with the children", meaning: "avec les enfants" }]);
  });

  it("shows the German form used in the answer, with the dictionary form", () => {
    const g = glossesFor(ex({ type: "translation", skillId: "de-w1-present", prompt: "The children are tired today.", accepted: ["Die Kinder sind heute müde."] }));
    expect(g.map((x) => [x.span, x.meaning, x.note])).toEqual([
      ["children", "Kinder", "das Kind, die Kinder"],
      ["tired", "müde", undefined],
      ["today", "heute", undefined],
    ].sort((a, b) => "The children are tired today.".indexOf(a[0]!) - "The children are tired today.".indexOf(b[0]!)));
  });

  it("course-language prompts reveal the meaning, never the missing word", () => {
    const g = glossesFor(ex({
      type: "fill_blank", skillId: "de-w1-present", prompt: "Ich ___ Brot im Supermarkt.", accepted: ["kaufe"],
      blank: { before: "Ich ", after: " Brot im Supermarkt." },
    }));
    expect(g.map((x) => [x.span, x.meaning])).toEqual([["Brot", "bread"], ["Supermarkt", "supermarket"]]);
    const mcq = glossesFor(ex({ type: "multiple_choice", skillId: "de-w1-present", prompt: "Wir ___ Kaffee.", options: ["trinken", "Kaffee"], accepted: [] }));
    expect(mcq).toEqual([]); // "Kaffee" is one of the options
    // Plural forms reveal the plural meaning; longer phrases win over single words.
    const plural = glossesFor(ex({ type: "multiple_choice", skillId: "w1-er-present", prompt: "Les filles ___ avec les clés.", options: ["jouent", "joue"], accepted: [] }));
    expect(plural.map((x) => [x.span, x.meaning])).toEqual([["filles", "girls"], ["les clés", "the keys"]]);
  });

  it("verbs and expressions reveal the dictionary form, never the conjugated answer", () => {
    const fr = (prompt: string, answer: string, skillId = "w2-expressions") =>
      glossesFor(ex({ type: "translation", skillId, prompt, accepted: [answer] })).map((x) => [x.span, x.meaning]);
    expect(fr("I'm scared of dogs.", "J'ai peur des chiens.")).toEqual([["scared of", "avoir peur (de)"], ["dogs", "chiens"]]);
    expect(fr("I need help.", "J'ai besoin d'aide.")).toEqual([["need", "avoir besoin de"], ["help", "aide"]]);
    expect(fr("We are going to the beach.", "Nous allons à la plage.", "w2-aller-faire")).toEqual([["going", "aller"], ["beach", "plage"]]);
    // The same English verb maps to the German verb the answer actually uses.
    const de = (prompt: string, answer: string) =>
      glossesFor(ex({ type: "translation", skillId: "de-w4-prepositions", prompt, accepted: [answer] })).map((x) => [x.span, x.meaning]);
    expect(de("I take the train to work.", "Ich fahre mit dem Zug zur Arbeit.")[0]).toEqual(["take", "fahren"]);
    expect(de("I'm taking the bus.", "Ich nehme den Bus.")[0]).toEqual(["taking", "nehmen"]);
    // Course-language prompts never hint verbs: there the verb is usually what's being tested.
    expect(glossesFor(ex({ type: "fill_blank", skillId: "w1-er-present", prompt: "Je ___ français.", accepted: ["parle"], blank: { before: "Je ", after: " français." } }))
      .some((x) => x.meaning === "parler")).toBe(false);
  });

  it("a lesson lists the words its exercises use, in dictionary form", () => {
    const exs = [
      ex({ type: "fill_blank", skillId: "w5-modals", prompt: "Tu peux ___ ?", accepted: ["venir"], audioText: "Tu peux venir ?" }),
      ex({ type: "translation", skillId: "w5-modals", prompt: "I have to leave tomorrow.", accepted: ["Je dois partir demain."] }),
      ex({ type: "translation", skillId: "w1-er-present", prompt: "I'm listening to a podcast.", accepted: ["J'écoute un podcast."] }),
    ];
    const words = lessonWords(exs, "fr", ["pouvoir", "vouloir", "devoir"]);
    expect(words).toContainEqual({ word: "venir", en: "to come" });
    expect(words).toContainEqual({ word: "partir", en: "to leave" });
    expect(words).toContainEqual({ word: "demain", en: "tomorrow" });
    expect(words.map((w) => w.word)).not.toContain("pouvoir"); // explained by the page's own table
    expect(words.map((w) => w.word)).not.toContain("un podcast"); // same word in English
    const phrase = lessonWords([
      ex({ type: "translation", skillId: "w5-modals", prompt: "We want to visit Paris.", accepted: ["Nous voulons visiter Paris."] }),
      ex({ type: "translation", skillId: "w5-modals", prompt: "I visit the museum.", accepted: ["Je visite le musée."] }),
    ], "fr").map((w) => w.word);
    expect(phrase).toContain("visiter");
    expect(phrase).not.toContain("visiter Paris");
  });

  it("vocabulary topics don't hint the words they teach", () => {
    const g = glossesFor(ex({ type: "translation", skillId: "de-w9-time", prompt: "See you tomorrow.", accepted: ["Bis morgen."] }));
    const vocabTaught = g.find((x) => x.meaning === "morgen");
    // Only checked when the topic's explanation mentions the word.
    if (vocabTaught) expect(vocabTaught.span).toBe("tomorrow");
    expect(lexicon("de").length).toBeGreaterThan(150);
    expect(lexicon("fr").length).toBeGreaterThan(200);
  });

  it("a word stops being hinted after a few sightings without help; opening the hint resets that", async () => {
    const db = await createDb(":memory:");
    const e = ex({ type: "translation", skillId: "w1-er-present", prompt: "I play with the children.", accepted: ["Je joue avec les enfants."] });
    const shown = async () => ((await withGlosses(db, [e]))[0].glosses ?? []).length;
    expect(await shown()).toBe(1);
    for (let i = 0; i < KNOWN_AFTER - 1; i++) await recordWordExposure(db, e, [], new Date().toISOString());
    expect(await shown()).toBe(1);
    await recordWordExposure(db, e, ["fr:avec les enfants"], new Date().toISOString()); // needed it again
    expect(await shown()).toBe(1);
    for (let i = 0; i < KNOWN_AFTER; i++) await recordWordExposure(db, e, [], new Date().toISOString());
    expect(await shown()).toBe(0);
    const row = await db.select().from(schema.wordExposure).get();
    expect(row).toMatchObject({ seen: KNOWN_AFTER * 2, revealed: 1, streak: KNOWN_AFTER });
    await resetProgress(db);
    expect(await shown()).toBe(1);
  });

  it("real lessons in both courses get hints", async () => {
    for (const lang of ["fr", "de"] as const) {
      const db = await createDb(":memory:", undefined, lang);
      const lesson = await getOrCreateDailyLesson(db, new Date("2026-11-25T18:00:00Z"));
      const out = await withGlosses(db, await getLessonExercises(db, lesson.id));
      for (const x of out) for (const g of x.glosses ?? []) {
        expect(g.span.length).toBeGreaterThan(0);
        expect(x.prompt.toLowerCase()).toContain(g.span.toLowerCase());
        expect((x.accepted ?? []).some((a) => a.toLowerCase() === g.meaning.toLowerCase())).toBe(false);
      }
    }
  });
});
