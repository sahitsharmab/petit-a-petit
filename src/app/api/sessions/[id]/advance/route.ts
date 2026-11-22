import { z } from "zod";
import { getDb } from "@/lib/db";
import { advance } from "@/lib/services/sessions";
import { handle, ok, parseBody } from "@/lib/api";

/** `fromIndex`: the queue position being left, so a repeated request can't skip a question. */
const Body = z.object({ fromIndex: z.number().int().min(0).optional() });

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { fromIndex } = await parseBody(req, Body);
  return ok({ state: await advance(await getDb(), id, fromIndex) });
});
