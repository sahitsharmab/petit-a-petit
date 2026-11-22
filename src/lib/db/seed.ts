import { sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { SKILLS, WEEKS } from "@/lib/content/curriculum";
import { TEMPLATES } from "@/lib/content/templates";
import * as schema from "./schema";

/**
 * Idempotently sync curriculum seed data into the database. Content lives in
 * typed modules (reviewed in code); the DB copy lets history and exports stay
 * self-describing. User progress tables are never touched here.
 */
export function syncSeed(db: BetterSQLite3Database<typeof schema>) {
  db.transaction((tx) => {
    for (const w of WEEKS) {
      tx.insert(schema.curriculumWeeks).values(w)
        .onConflictDoUpdate({ target: schema.curriculumWeeks.number, set: { title: w.title, focus: w.focus, cefr: w.cefr, description: w.description } })
        .run();
    }
    for (const s of SKILLS) {
      const row = {
        id: s.id, weekNumber: s.week, position: s.order, title: s.title, short: s.short, cefr: s.cefr,
        category: s.category, summary: s.summary,
        content: { objectives: s.objectives, explanation: s.explanation, tip: s.tip ?? null, practice: s.practice },
      };
      tx.insert(schema.learningSkills).values(row).onConflictDoUpdate({ target: schema.learningSkills.id, set: row }).run();
    }
    for (const t of TEMPLATES) {
      const row = { id: t.id, name: t.name, description: t.description, blocks: t.blocks };
      tx.insert(schema.lessonTemplates).values(row).onConflictDoUpdate({ target: schema.lessonTemplates.id, set: row }).run();
    }
    tx.insert(schema.learningSettings).values({ id: 1 }).onConflictDoNothing().run();
  });
  // Keep the planner fast on large histories.
  db.run(sql`PRAGMA optimize`);
}
