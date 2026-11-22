/**
 * Apply migrations and sync curriculum seed data.
 *   npm run db:migrate   → data/french.db locally, or every account's database in accounts mode
 */
import { createDb } from "../src/lib/db";
import { authEnabled, localUser } from "../src/lib/auth/users";
import { listAccounts } from "../src/lib/auth/accounts";

async function main() {
  const users = authEnabled() ? await listAccounts() : [localUser()];
  for (const u of users) {
    await createDb(u.dbUrl, u.dbToken);
    console.log(`✓ Database ready for ${u.id}: ${u.dbUrl.replace(/\?.*$/, "")}`);
  }
  if (!users.length) console.log("No accounts yet.");
}
main().catch((e) => { console.error(e); process.exit(1); });
