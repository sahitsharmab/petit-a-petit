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

  it("examples and table rows are complete", () => {
    for (const s of courseSkills("fr")) for (const x of s.explanation) {
      for (const e of x.examples ?? []) { expect(e.fr.trim(), s.id).not.toBe(""); expect(e.en.trim(), s.id).not.toBe(""); }
      for (const r of x.table?.rows ?? []) expect(r.length, `${s.id}: ${r.join(" | ")}`).toBe(x.table!.headers.length);
    }
  });
});
