import { describe, expect, it } from "vitest";
import { SKILLS, WEEKS } from "@/lib/content/curriculum";
import { BANK } from "@/lib/content/bank";
import { SCENARIOS } from "@/lib/content/scenarios";
import { createRng, exerciseForItem, generateExercise } from "@/lib/content/generate";
import { assembleLesson } from "@/lib/learning/assemble";
import { TEMPLATES } from "@/lib/content/templates";
import { evaluateAnswer } from "@/lib/french/evaluate";
import { matchScore } from "@/lib/services/conversations";

const ctx = (seed: number) => ({ rng: createRng(seed), section: "core" as const, idPrefix: "t", counter: { n: 0 } });

describe("curriculum content integrity", () => {
  it("has 12 weeks and every week has skills", () => {
    expect(WEEKS).toHaveLength(12);
    for (const w of WEEKS) expect(SKILLS.some((s) => s.week === w.number)).toBe(true);
  });
  it("bank MCQs have valid, unique options", () => {
    for (const [skill, bank] of Object.entries(BANK)) {
      for (const q of bank.mcq ?? []) {
        expect(q.answer, `${skill}/${q.id}`).toBeLessThan(q.options.length);
        expect(new Set(q.options).size, `${skill}/${q.id}`).toBe(q.options.length);
      }
      for (const d of bank.dialogues ?? []) expect(d.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });
  it("every skill can generate each of its exercise types, and answers validate against themselves", () => {
    for (const s of SKILLS) {
      for (const t of s.practice.types) {
        let made = 0;
        for (let seed = 1; seed <= 8; seed++) {
          const ex = generateExercise(ctx(seed * 97 + t.length), s.id, t);
          if (!ex) continue;
          made++;
          if (ex.options) {
            expect(ex.answerIndex, `${s.id}/${t}`).toBeGreaterThanOrEqual(0);
          } else {
            const self = evaluateAnswer({ answer: ex.accepted[0], accepted: ex.accepted, confusables: ex.confusables });
            expect(self.verdict, `${s.id}/${t}: ${ex.accepted[0]}`).toBe("correct");
            // No confusable may coincide with an accepted answer.
            for (const c of ex.confusables ?? []) {
              expect(evaluateAnswer({ answer: c.text, accepted: ex.accepted }).verdict, `${s.id}/${t} confusable ${c.text}`).not.toBe("correct");
            }
          }
          expect(exerciseForItem(ctx(seed), ex.itemKey), ex.itemKey).not.toBeNull();
        }
        expect(made, `${s.id}/${t}`).toBeGreaterThan(0);
      }
    }
  });
  it("assembles complete daily lessons for every skill", () => {
    for (const s of SKILLS) {
      const ex = assembleLesson({ lessonId: "L", templateId: "daily-standard", primarySkillId: s.id, reviewKeys: [], weekNumber: s.week, seed: 42 });
      expect(ex.length, s.id).toBeGreaterThanOrEqual(6);
      expect(new Set(ex.map((e) => e.id)).size).toBe(ex.length);
      expect(ex.some((e) => e.section === "build"), `${s.id} build`).toBe(true);
    }
  });
  it("varies content between days", () => {
    const a = assembleLesson({ lessonId: "L", templateId: "daily-standard", primarySkillId: "w1-er-present", reviewKeys: [], weekNumber: 1, seed: 1 });
    const b = assembleLesson({ lessonId: "L", templateId: "daily-standard", primarySkillId: "w1-er-present", reviewKeys: [], weekNumber: 1, seed: 2, recentItemKeys: a.map((e) => e.itemKey) });
    const overlap = b.filter((e) => a.some((x) => x.itemKey === e.itemKey && x.type === e.type)).length;
    expect(overlap).toBeLessThan(b.length / 2);
  });
  it("templates reference known blocks", () => {
    for (const t of TEMPLATES) expect(t.blocks.length).toBeGreaterThan(0);
  });
});

describe("scripted conversations", () => {
  it("every scenario path terminates and links resolve", () => {
    for (const sc of SCENARIOS) {
      expect(sc.nodes[sc.start]).toBeDefined();
      for (const node of Object.values(sc.nodes)) for (const r of node.replies) if (r.next) expect(sc.nodes[r.next], `${sc.id}:${r.next}`).toBeDefined();
      expect(Object.values(sc.nodes).some((n) => n.replies.length === 0)).toBe(true);
    }
  });
  it("matches free-typed replies to the intended option", () => {
    const cafe = SCENARIOS.find((s) => s.id === "cafe")!;
    const [creme, the] = cafe.nodes.c1.replies;
    expect(matchScore("un cafe creme svp", creme)).toBeGreaterThanOrEqual(0.4);
    expect(matchScore("un café crème s'il vous plaît", creme)).toBeGreaterThan(matchScore("un café crème s'il vous plaît", the));
    expect(matchScore("j'aime les chats", creme)).toBeLessThan(0.4);
  });
});
