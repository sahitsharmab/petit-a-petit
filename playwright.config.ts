import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 90_000,
  use: { baseURL: "http://localhost:3100", trace: "off" },
  webServer: {
    command: "rm -f data/e2e.db data/e2e.db-wal data/e2e.db-shm && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: { FRANCAIS_DB_PATH: "./data/e2e.db", AI_PROVIDER: "none" },
    timeout: 120_000,
  },
});
