import { z } from "zod";
import { getDb } from "@/lib/db";
import { isScriptFinished, sendMessage } from "@/lib/services/conversations";
import { handle, ok, parseBody } from "@/lib/api";

const Body = z.object({ text: z.string().max(400).default(""), replyIndex: z.number().int().min(0).max(5).optional() });

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await parseBody(req, Body);
  const conv = await sendMessage(getDb(), id, body.text, body.replyIndex);
  return ok({ conversation: conv, finished: isScriptFinished(conv) });
});
