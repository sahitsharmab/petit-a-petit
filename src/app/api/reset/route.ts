import { z } from "zod";
import { getDb } from "@/lib/db";
import { resetProgress } from "@/lib/services/backup";
import { handle, ok, parseBody } from "@/lib/api";

export const POST = handle(async (req: Request) => {
  await parseBody(req, z.object({ confirm: z.literal("RESET") }));
  resetProgress(getDb());
  return ok({ reset: true });
});
