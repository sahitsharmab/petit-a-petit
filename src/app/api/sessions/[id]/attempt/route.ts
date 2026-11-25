import { z } from "zod";
import { getDb } from "@/lib/db";
import { createAnswerJudge } from "@/lib/ai/features";
import { submitAttempt } from "@/lib/services/sessions";
import { handle, ok, parseBody } from "@/lib/api";

const Body = z.object({
  exerciseId: z.string().min(1),
  answer: z.string().max(500),
  hintsUsed: z.number().int().min(0).max(5).default(0),
  /** 1 for the first try, 2 for the retry/reveal; makes duplicate deliveries safe. */
  attemptNo: z.number().int().min(1).max(10).optional(),
  /** Listening: the transcript was visible (supported practice). */
  transcriptShown: z.boolean().optional(),
  /** Word hints the learner opened (keys from the exercise's glosses). */
  wordsRevealed: z.array(z.string().max(120)).max(10).optional(),
});

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await parseBody(req, Body);
  const db = await getDb();
  const res = await submitAttempt(db, id, body.exerciseId, body.answer, body.hintsUsed, new Date(), await createAnswerJudge(db), body.attemptNo, { transcriptShown: body.transcriptShown, wordsRevealed: body.wordsRevealed });
  return ok(res);
});
