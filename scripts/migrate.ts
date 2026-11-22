/** Apply migrations and sync curriculum seed data. Usage: npm run db:migrate */
import path from "node:path";
import { createDb } from "../src/lib/db";

const file = process.env.FRANCAIS_DB_PATH ?? path.join(process.cwd(), "data", "french.db");
createDb(file);
console.log(`✓ Database ready: ${file}`);
