import { getDb } from "@/lib/db";
import { advance } from "@/lib/services/sessions";
import { handle, ok } from "@/lib/api";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  return ok({ state: advance(getDb(), id) });
});
