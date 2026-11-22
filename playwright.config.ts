import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 90_000,
  use: { baseURL: "http://localhost:3100", trace: "off" },
  webServer: {
    // Node instead of `rm -f` so this also works in Windows cmd.exe.
    command:
      `node -e "for (const f of ['data/e2e.db','data/e2e.db-wal','data/e2e.db-shm']) require('fs').rmSync(f, { force: true })"` +
      " && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: { FRANCAIS_DB_PATH: "./data/e2e.db", AI_PROVIDER: "none" },
    timeout: 120_000,
  },
});
