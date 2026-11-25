import { inArray, sql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { glossesFor } from "@/lib/content/lexicon";
import type { Exercise, Gloss } from "@/lib/content/types";

/** Sightings in a row without opening the hint after which a word counts as known. */
export const KNOWN_AFTER = 3;

/** Add the word hints the learner still needs to each exercise (one query for the whole lesson). */
export async function withGlosses<T extends Exercise>(db: DB, exercises: T[]): Promise<(T & { glosses?: Gloss[] })[]> {
  const all = exercises.map((ex) => glossesFor(ex));
  const keys = [...new Set(all.flat().map((g) => g.key))];
  if (!keys.length) return exercises;
  const rows = await db.select({ key: schema.wordExposure.key, streak: schema.wordExposure.streak })
    .from(schema.wordExposure).where(inArray(schema.wordExposure.key, keys)).all();
  const known = new Set(rows.filter((r) => r.streak >= KNOWN_AFTER).map((r) => r.key));
  return exercises.map((ex, i) => {
    const glosses = all[i].filter((g) => !known.has(g.key));
    return glosses.length ? { ...ex, glosses } : ex;
  });
}

/**
 * Count one sighting of every hintable word in the exercise. Opened hints reset the word's streak,
 * so it keeps its hint until the learner has met it a few times without needing it.
 */
export async function recordWordExposure(db: DB, ex: Exercise, revealed: string[], nowIso: string) {
  const keys = [...new Set(glossesFor(ex).map((g) => g.key))];
  if (!keys.length) return;
  const opened = new Set(revealed);
  for (const key of keys) {
    const r = opened.has(key);
    await db.insert(schema.wordExposure).values({ key, seen: 1, revealed: r ? 1 : 0, streak: r ? 0 : 1, updatedAt: nowIso })
      .onConflictDoUpdate({
        target: schema.wordExposure.key,
        set: {
          seen: sql`${schema.wordExposure.seen} + 1`,
          revealed: sql`${schema.wordExposure.revealed} + ${r ? 1 : 0}`,
          streak: r ? 0 : sql`${schema.wordExposure.streak} + 1`,
          updatedAt: nowIso,
        },
      }).run();
  }
}
