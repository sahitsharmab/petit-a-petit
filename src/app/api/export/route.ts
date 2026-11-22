import { getDb } from "@/lib/db";
import { exportProgress } from "@/lib/services/backup";
import { parisDate } from "@/lib/learning/dates";

export const dynamic = "force-dynamic";

export function GET() {
  const body = JSON.stringify(exportProgress(getDb()), null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="petit-a-petit-backup-${parisDate()}.json"`,
    },
  });
}
