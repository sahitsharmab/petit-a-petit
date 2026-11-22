import { describe, expect, it } from "vitest";
import { DE_SKILLS, DE_WEEKS } from "@/lib/content/de/curriculum";
import { DE_BANK } from "@/lib/content/de/bank";
import { DE_SCENARIOS } from "@/lib/content/de/scenarios";
import { courseSkills, getSkill } from "@/lib/content/curriculum";
import { scenariosFor } from "@/lib/content/scenarios";
import { createRng, exerciseForItem, generateExercise } from "@/lib/content/generate";
import { langOfSkill } from "@/lib/content/languages";
import { assembleLesson } from "@/lib/learning/assemble";
import { evaluateAnswer } from "@/lib/french/evaluate";
import { hasNegation, matchScore, startConversation } from "@/lib/services/conversations";
import { createDb, schema } from "@/lib/db";
import { createPracticeLesson, getOrCreateDailyLesson } from "@/lib/services/lessons";
import { getDashboard } from "@/lib/services/stats";
import { exportProgress, importProgress } from "@/lib/services/backup";

const ctx = (seed: number) => ({ rng: createRng(seed), section: "core" as const, idPrefix: "t", counter: { n: 0 } });

describe("German course content", () => {
  it("has 12 weeks, every week has skills, and every id is German", () => {
    expect(DE_WEEKS).toHaveLength(12);
    for (const w of DE_WEEKS) expect(DE_SKILLS.some((s) => s.week === w.number)).toBe(true);
    for (const s of DE_SKILLS) expect(langOfSkill(s.id), s.id).toBe("de");
    for (const s of DE_SKILLS) for (const inc of s.practice.includeSkills ?? []) expect(getSkill(inc).id).toBe(inc);
    expect(courseSkills("de")).toBe(DE_SKILLS);
  });

  it("bank items are valid", () => {
    for (const [skill, bank] of Object.entries(DE_BANK)) {
      expect(() => getSkill(skill), skill).not.toThrow();
      for (const q of bank.mcq ?? []) {
        expect(q.answer, `${skill}/${q.id}`).toBeLessThan(q.options.length);
        expect(new Set(q.options).size, `${skill}/${q.id}`).toBe(q.options.length);
        if (q.typeable) expect(new Set(q.options.map((o) => o.toLowerCase())).size, `${skill}/${q.id} case`).toBe(q.options.length);
      }
      for (const d of bank.dialogues ?? []) expect(d.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });

  it("every German skill can generate each of its exercise types, and answers validate against themselves", () => {
    for (const s of DE_SKILLS) {
      for (const t of s.practice.types) {
        let made = 0;
        for (let seed = 1; seed <= 8; seed++) {
          const ex = generateExercise(ctx(seed * 97 + t.length), s.id, t);
          if (!ex) continue;
          made++;
          expect(langOfSkill(ex.skillId), `${s.id}/${t} stays in the German course`).toBe("de");
          expect(ex.instruction).not.toMatch(/French/);
          expect(ex.prompt).not.toMatch(/French/);
          if (ex.options) {
            expect(ex.answerIndex, `${s.id}/${t}`).toBeGreaterThanOrEqual(0);
          } else {
            const self = evaluateAnswer({ answer: ex.accepted[0], accepted: ex.accepted, confusables: ex.confusables, lang: "de" });
            expect(self.verdict, `${s.id}/${t}: ${ex.accepted[0]}`).toBe("correct");
            for (const c of ex.confusables ?? []) {
              expect(evaluateAnswer({ answer: c.text, accepted: ex.accepted, lang: "de" }).verdict, `${s.id}/${t} confusable ${c.text}`).not.toBe("correct");
            }
          }
          expect(exerciseForItem(ctx(seed), ex.itemKey), ex.itemKey).not.toBeNull();
        }
        expect(made, `${s.id}/${t}`).toBeGreaterThan(0);
      }
    }
  });

  it("assembles complete daily lessons for every German skill, using only German skills", () => {
    for (const s of DE_SKILLS) {
      const ex = assembleLesson({ lessonId: "L", templateId: "daily-standard", primarySkillId: s.id, reviewKeys: ["skill:w1-er-present"], weekNumber: s.week, seed: 42 });
      expect(ex.length, s.id).toBeGreaterThanOrEqual(6);
      expect(ex.some((e) => e.section === "build"), `${s.id} build`).toBe(true);
      for (const e of ex) expect(langOfSkill(e.skillId), `${s.id}: ${e.itemKey}`).toBe("de");
    }
  });

  it("drills accept the form with or without the subject, and explain wrong forms", () => {
    const ex = exerciseForItem(ctx(1), "drill:de-w5-stem-change:d1")!;
    expect(ex.type).toBe("conjugation");
    expect(ex.prompt).toBe("fahren → du");
    expect(evaluateAnswer({ answer: "fährst", accepted: ex.accepted, confusables: ex.confusables, lang: "de" }).verdict).toBe("correct");
    expect(evaluateAnswer({ answer: "du fährst", accepted: ex.accepted, confusables: ex.confusables, lang: "de" }).verdict).toBe("correct");
    const wrong = evaluateAnswer({ answer: "fahrst", accepted: ex.accepted, confusables: ex.confusables, lang: "de" });
    expect(wrong.verdict).toBe("incorrect");
    expect(wrong.note).toMatch(/vowel/);
    const she = exerciseForItem(ctx(1), "drill:de-w1-present:d7")!;
    expect(evaluateAnswer({ answer: "sie arbeitet", accepted: she.accepted, lang: "de" }).verdict).toBe("correct");
  });
});

describe("German answer checking", () => {
  it("treats missing umlauts, ae/oe/ue and ss as almost right", () => {
    for (const typed of ["Ich hore Musik.", "Ich hoere Musik."]) {
      const r = evaluateAnswer({ answer: typed, accepted: ["Ich höre Musik."], lang: "de" });
      expect(r.verdict, typed).toBe("almost");
      expect(r.mistakeTag).toBe("umlauts");
    }
    expect(evaluateAnswer({ answer: "Die Strasse ist lang.", accepted: ["Die Straße ist lang."], lang: "de" }).verdict).toBe("almost");
    expect(evaluateAnswer({ answer: "ich höre musik", accepted: ["Ich höre Musik."], lang: "de" }).verdict).toBe("correct");
  });

  it("spots a missing nicht / kein and skips French elision rules", () => {
    const r = evaluateAnswer({ answer: "Ich habe Zeit.", accepted: ["Ich habe keine Zeit."], lang: "de" });
    expect(r.mistakeTag).toBe("negation");
    expect(r.note).toMatch(/nicht/);
    expect(evaluateAnswer({ answer: "le ami", accepted: ["l'ami"], lang: "de" }).mistakeTag).not.toBe("elision");
  });

  it("understands German negation and free-typed replies in scripted conversations", () => {
    expect(hasNegation("Ich möchte keinen Kaffee", "de")).toBe(true);
    expect(hasNegation("Das geht nicht", "de")).toBe(true);
    expect(hasNegation("Ich möchte einen Kaffee", "de")).toBe(false);
    const cafe = DE_SCENARIOS.find((s) => s.id === "de-cafe")!;
    const [kaffee, tee] = cafe.nodes.c1.replies;
    expect(matchScore("einen milchkaffee bitte", kaffee)).toBeGreaterThanOrEqual(0.4);
    expect(matchScore("Ich hätte gern einen Tee", tee)).toBeGreaterThan(matchScore("Ich hätte gern einen Tee", kaffee));
  });

  it("every German scenario path terminates and links resolve", () => {
    expect(scenariosFor("de")).toHaveLength(8);
    for (const sc of DE_SCENARIOS) {
      expect(langOfSkill(sc.id)).toBe("de");
      expect(sc.nodes[sc.start]).toBeDefined();
      for (const node of Object.values(sc.nodes)) for (const r of node.replies) if (r.next) expect(sc.nodes[r.next], `${sc.id}:${r.next}`).toBeDefined();
      expect(Object.values(sc.nodes).some((n) => n.replies.length === 0)).toBe(true);
      for (const s of sc.skills) expect(langOfSkill(getSkill(s).id)).toBe("de");
    }
  });
});

describe("a German learner database", () => {
  it("seeds the German curriculum and plans German lessons only", async () => {
    const db = await createDb(":memory:", undefined, "de");
    const weeks = await db.select().from(schema.curriculumWeeks).all();
    expect(weeks.find((w) => w.number === 3)?.title).toBe("Nouns & the accusative");
    const skills = await db.select().from(schema.learningSkills).all();
    expect(skills.every((s) => s.id.startsWith("de-"))).toBe(true);
    const settings = await db.select().from(schema.learningSettings).get();
    expect(settings?.autoPlayAudio).toBe(false); // new learners start with automatic audio off

    const lesson = await getOrCreateDailyLesson(db, new Date("2026-11-16T19:00:00Z"));
    expect(lesson.primarySkillId).toBe("de-w1-pronouns");
    const d = await getDashboard(db, new Date("2026-11-16T19:00:00Z"));
    expect(d.frontier.id).toBe("de-w1-pronouns");
    expect(d.curriculum.total).toBe(DE_SKILLS.filter((s) => s.category !== "review").length);

    const week = await createPracticeLesson(db, { kind: "week", week: 5 });
    expect(week.primarySkillId.startsWith("de-w5")).toBe(true);
    await expect(createPracticeLesson(db, { kind: "skill", skillId: "w1-er-present" })).rejects.toMatchObject({ status: 404 });
    await expect(startConversation(db, "cafe")).rejects.toMatchObject({ status: 404 });
    const conv = await startConversation(db, "de-cafe");
    expect(conv.messages[0].fr).toMatch(/Guten Tag/);
  });

  it("refuses to import a backup from the other course", async () => {
    const fr = await createDb(":memory:");
    const de = await createDb(":memory:", undefined, "de");
    const frBackup = await exportProgress(fr);
    expect(frBackup.language).toBe("fr");
    await expect(importProgress(de, frBackup)).rejects.toThrow(/French progress, but your course is German/);
    const { language: _drop, ...legacy } = frBackup; // backups from before course choice are French
    void _drop;
    await expect(importProgress(de, legacy)).rejects.toThrow(/French/);
    await expect(importProgress(fr, legacy)).resolves.toBeDefined();
    await expect(importProgress(de, await exportProgress(de))).resolves.toBeDefined();
  });
});
