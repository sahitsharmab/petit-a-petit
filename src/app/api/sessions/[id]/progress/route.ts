import { z } from "zod";
import { getDb } from "@/lib/db";
import { saveProgress } from "@/lib/services/sessions";
import { handle, ok, parseBody } from "@/lib/api";

const Body = z.object({
  phase: z.enum(["intro", "exercise"]).optional(),
  index: z.number().int().min(0).optional(),
  activeSecondsDelta: z.number().min(0).max(600).optional(),
});

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const s = await saveProgress(await getDb(), id, await parseBody(req, Body));
  return ok({ state: s.state, activeSeconds: s.activeSeconds });
});
