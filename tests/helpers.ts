import type { createDb } from "@/lib/db";
import type { Exercise } from "@/lib/content/types";
import { advance, getSession, submitAttempt } from "@/lib/services/sessions";

export type TestDb = Awaited<ReturnType<typeof createDb>>;

/** The canonical correct answer for an exercise, as the client would send it. */
export const right = (e: Exercise) => (e.options ? String(e.answerIndex) : e.accepted[0]);

/** Answer exercises correctly, in order, until `targetId` is the current exercise. */
export async function answerUntil(db: TestDb, sessionId: string, exercises: Exercise[], targetId: string) {
  let state = (await getSession(db, sessionId)).state;
  while (state.queue[state.index] !== targetId) {
    if (state.index >= state.queue.length) throw new Error(`exercise ${targetId} is not in the queue`);
    const ex = exercises.find((e) => e.id === state.queue[state.index])!;
    await submitAttempt(db, sessionId, ex.id, right(ex), 0);
    state = (await advance(db, sessionId, state.index));
  }
  return state;
}
