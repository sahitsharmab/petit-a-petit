import path from "node:path";
import { getDb, localPathOf } from "@/lib/db";
import { currentUser } from "@/lib/auth/current";
import { BackupError, importProgress, previewImport } from "@/lib/services/backup";
import { handle, ok } from "@/lib/api";
import { HttpError } from "@/lib/http-error";

/**
 * POST a backup file.
 *  - `?preview=1` validates it and returns what it contains, without changing anything.
 *    `safetyCopy` says how the current progress is kept: "server" (a file next to a local
 *    database) or "download" (hosted: the browser downloads an export before importing).
 *  - Otherwise the current progress is replaced (after a server-side safety copy when local).
 */
export const POST = handle(async (req: Request) => {
  const preview = new URL(req.url).searchParams.get("preview") === "1";
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "That file isn't valid JSON.");
  }
  const user = await currentUser();
  const localFile = localPathOf(user.dbUrl);
  try {
    if (preview) return ok({ preview: previewImport(raw, user.lang), safetyCopy: localFile ? "server" : "download" });
    const db = await getDb();
    const res = await importProgress(db, raw, localFile ? { safetyCopyDir: path.join(path.dirname(localFile), "backups") } : {});
    const { safetyCopy, ...imported } = res;
    return ok({ imported, safetyCopy: safetyCopy ? path.basename(safetyCopy) : undefined });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof BackupError) throw new HttpError(400, `${e.message} Nothing was changed.`);
    throw new HttpError(400, `Import failed, nothing was changed: ${(e as Error).message}`);
  }
});
