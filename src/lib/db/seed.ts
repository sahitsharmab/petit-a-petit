import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { BatchItem } from "drizzle-orm/batch";
import { courseSkills, courseWeeks } from "@/lib/content/curriculum";
import type { Lang } from "@/lib/content/languages";
import { TEMPLATES } from "@/lib/content/templates";
import * as schema from "./schema";

/**
 * Idempotently sync curriculum seed data into the database. Content lives in
 * typed modules (reviewed in code); the DB copy lets history and exports stay
 * self-describing. User progress tables are never touched here.
 * Runs as one atomic batch (a single round trip to a remote database).
 */
export async function syncSeed(db: LibSQLDatabase<typeof schema> & { lang?: Lang }) {
  const q: BatchItem<"sqlite">[] = [];
  const WEEKS = courseWeeks(db.lang);
  const SKILLS = courseSkills(db.lang);
  for (const w of WEEKS) {
    q.push(db.insert(schema.curriculumWeeks).values(w)
      .onConflictDoUpdate({ target: schema.curriculumWeeks.number, set: { title: w.title, focus: w.focus, cefr: w.cefr, description: w.description } }));
  }
  for (const s of SKILLS) {
    const row = {
      id: s.id, weekNumber: s.week, position: s.order, title: s.title, short: s.short, cefr: s.cefr,
      category: s.category, summary: s.summary,
      content: { objectives: s.objectives, explanation: s.explanation, tip: s.tip ?? null, practice: s.practice },
    };
    q.push(db.insert(schema.learningSkills).values(row).onConflictDoUpdate({ target: schema.learningSkills.id, set: row }));
  }
  for (const t of TEMPLATES) {
    const row = { id: t.id, name: t.name, description: t.description, blocks: t.blocks };
    q.push(db.insert(schema.lessonTemplates).values(row).onConflictDoUpdate({ target: schema.lessonTemplates.id, set: row }));
  }
  q.push(db.insert(schema.learningSettings).values(schema.NEW_LEARNER_SETTINGS).onConflictDoNothing());
  await db.batch(q as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
}
