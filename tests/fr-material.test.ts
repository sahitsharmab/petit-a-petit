import { describe, expect, it } from "vitest";
import { FR_MATERIAL } from "@/lib/content/fr-material";
import { courseSkills, getSkill } from "@/lib/content/curriculum";

describe("French lesson material", () => {
  it("every patch matches a real section, so no material is silently dropped", () => {
    for (const [id, m] of Object.entries(FR_MATERIAL)) {
      const headings = getSkill(id).explanation.map((s) => s.heading);
      for (const h of Object.keys(m.patch ?? {})) expect(headings, `${id}: "${h}"`).toContain(h);
    }
  });

  it("every French topic has plenty of spoken examples or phrase tables", () => {
    for (const s of courseSkills("fr")) {
      if (s.id === "w12-assessment") continue;
      const spoken = s.explanation.reduce((n, x) => n + (x.examples?.length ?? 0) + (x.table?.rows.length ?? 0), 0);
      expect(spoken, s.id).toBeGreaterThanOrEqual(6);
    }
  });

  it("irregular verbs drilled in a topic have their forms in that topic's tables", () => {
    // Regular verbs follow the rule taught in the topic; irregular ones must be spelled out.
    for (const id of ["w2-etre", "w2-avoir", "w5-modals", "w5-irregular", "w8-pc-irregular"]) {
      const s = getSkill(id);
      const firstCol = s.explanation.flatMap((x) => [...(x.table?.headers ?? []), ...(x.table?.rows.map((r) => r[0]) ?? [])]);
      for (const v of s.practice.conj?.verbs ?? []) expect(firstCol, `${id}: ${v}`).toContain(v);
    }
  });

  it("examples and table rows are complete", () => {
    for (const s of courseSkills("fr")) for (const x of s.explanation) {
      for (const e of x.examples ?? []) { expect(e.fr.trim(), s.id).not.toBe(""); expect(e.en.trim(), s.id).not.toBe(""); }
      for (const r of x.table?.rows ?? []) expect(r.length, `${s.id}: ${r.join(" | ")}`).toBe(x.table!.headers.length);
    }
  });
});
