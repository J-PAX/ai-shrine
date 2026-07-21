import { defineConfig, devices } from "@playwright/test";

const databaseUrl = process.env.E2E_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("E2E_DATABASE_URL is required to run Playwright tests.");
}

const appUrl = "http://127.0.0.1:3101";
const staleAppUrl = "http://127.0.0.1:3102";
const openAIUrl = "http://127.0.0.1:4101";
const staleDatabaseUrl = new URL(databaseUrl);
const schema = staleDatabaseUrl.searchParams.get("schema");

if (!schema) {
  throw new Error("E2E_DATABASE_URL must contain a schema query parameter.");
}

staleDatabaseUrl.searchParams.set("schema", `${schema}_stale`);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node e2e/openai-mock.mjs",
      url: `${openAIUrl}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: "ignore",
      stderr: "pipe",
      gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
    },
    {
      command: "npm run dev -- --port 3101",
      url: `${appUrl}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        NEXT_DIST_DIR: ".next-e2e",
        OPENAI_API_KEY: "e2e-local-key",
        OPENAI_MODEL: "e2e-local-model",
        OPENAI_RESPONSES_URL: `${openAIUrl}/v1/responses`,
      },
    },
    {
      command: "npm run dev -- --port 3102",
      url: staleAppUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
      env: {
        ...process.env,
        DATABASE_URL: staleDatabaseUrl.toString(),
        NEXT_DIST_DIR: ".next-e2e-stale",
        OPENAI_API_KEY: "e2e-local-key",
        OPENAI_MODEL: "e2e-local-model",
        OPENAI_RESPONSES_URL: `${openAIUrl}/v1/responses`,
      },
    },
  ],
});
