import path from "node:path";
import { dbFilePath, getDb } from "@/lib/db";
import { BackupError, importProgress, previewImport } from "@/lib/services/backup";
import { handle, ok } from "@/lib/api";
import { HttpError } from "@/lib/services/sessions";

/**
 * POST a backup file.
 *  - `?preview=1` validates it and returns what it contains, without changing anything.
 *  - Otherwise the current progress is saved to data/backups/ first, then replaced.
 */
export const POST = handle(async (req: Request) => {
  const preview = new URL(req.url).searchParams.get("preview") === "1";
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "That file isn't valid JSON.");
  }
  try {
    if (preview) return ok({ preview: previewImport(raw) });
    const db = getDb();
    const res = importProgress(db, raw, { safetyCopyDir: path.join(path.dirname(dbFilePath()), "backups") });
    const { safetyCopy, ...imported } = res;
    return ok({ imported, safetyCopy: safetyCopy ? path.basename(safetyCopy) : undefined });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof BackupError) throw new HttpError(400, `${e.message} Nothing was changed.`);
    throw new HttpError(400, `Import failed, nothing was changed: ${(e as Error).message}`);
  }
});
