import { getDb } from "@/lib/db";
import { endConversation } from "@/lib/services/conversations";
import { handle, ok } from "@/lib/api";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  return ok({ conversation: await endConversation(getDb(), id) });
});
