import { z } from "zod";
import { getDb } from "@/lib/db";
import { startConversation } from "@/lib/services/conversations";
import { handle, ok, parseBody } from "@/lib/api";

export const POST = handle(async (req: Request) => {
  const { scenarioId } = await parseBody(req, z.object({ scenarioId: z.string().min(1) }));
  return ok({ id: (await startConversation(await getDb(), scenarioId)).id });
});
