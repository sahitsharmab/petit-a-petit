/**
 * Apply migrations and sync curriculum seed data.
 *   npm run db:migrate                      → every configured learner's database (or data/french.db locally)
 */
import { createDb } from "../src/lib/db";
import { loadUsers } from "../src/lib/auth/users";

async function main() {
  for (const u of loadUsers()) {
    await createDb(u.dbUrl, u.dbToken);
    console.log(`✓ Database ready for ${u.id}: ${u.dbUrl.replace(/\?.*$/, "")}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
