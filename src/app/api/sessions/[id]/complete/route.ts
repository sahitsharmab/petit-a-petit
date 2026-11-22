import { getDb } from "@/lib/db";
import { completeSession } from "@/lib/services/sessions";
import { handle, ok } from "@/lib/api";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  return ok({ summary: completeSession(getDb(), id) });
});
