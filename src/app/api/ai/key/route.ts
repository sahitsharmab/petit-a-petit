import { z } from "zod";
import { getDb } from "@/lib/db";
import { removeLearnerKey, saveLearnerKey } from "@/lib/ai/learner";
import { handle, ok, parseBody } from "@/lib/api";

export const dynamic = "force-dynamic";

const Body = z.object({ apiKey: z.string().max(300).optional(), model: z.string().max(60).optional() }).strict();

/** Save or replace the signed-in learner's own Anthropic key (checked first), or change its model. */
export const PUT = handle(async (req: Request) => {
  const body = await parseBody(req, Body);
  return ok(await saveLearnerKey(await getDb(), body));
});

/** Forget the learner's key. */
export const DELETE = handle(async () => ok(await removeLearnerKey(await getDb())));
