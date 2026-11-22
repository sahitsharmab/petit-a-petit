import { getDb } from "@/lib/db";
import { importProgress } from "@/lib/services/backup";
import { handle, ok } from "@/lib/api";
import { HttpError } from "@/lib/services/sessions";

export const POST = handle(async (req: Request) => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "That file isn't valid JSON.");
  }
  try {
    return ok({ imported: importProgress(getDb(), raw) });
  } catch (e) {
    if (e instanceof HttpError || (e as Error).name === "ZodError") throw e;
    throw new HttpError(400, `Import failed, nothing was changed: ${(e as Error).message}`);
  }
});
