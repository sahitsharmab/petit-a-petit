import { getDb } from "@/lib/db";
import { exportProgress } from "@/lib/services/backup";
import { parisDate } from "@/lib/learning/dates";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const body = JSON.stringify(await exportProgress(await getDb()), null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="petit-a-petit-backup-${parisDate()}.json"`,
    },
  });
});
