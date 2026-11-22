import { getDb } from "@/lib/db";
import { restartSession } from "@/lib/services/sessions";
import { handle, ok } from "@/lib/api";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const s = await restartSession(await getDb(), id);
  return ok({ sessionId: s.id, state: s.state });
});
