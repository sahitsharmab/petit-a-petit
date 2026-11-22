/** Delete the local database (all progress!). Usage: npm run db:reset -- --yes */
import fs from "node:fs";
import path from "node:path";

const file = process.env.FRANCAIS_DB_PATH ?? path.join(process.cwd(), "data", "french.db");
if (!process.argv.includes("--yes")) {
  console.error(`This deletes ALL progress in ${file}. Export a backup from Settings first, then run: npm run db:reset -- --yes`);
  process.exit(1);
}
for (const f of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(f, { force: true });
console.log("✓ Database deleted. It will be recreated on next start.");
