import { defineConfig, devices } from "@playwright/test";

// PW_CHROMIUM_PATH lets a machine with a preinstalled Chromium skip the download.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3200",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "pnpm start --port 3200",
    // A throwaway database and secret for the test run.
    env: {
      PGLITE_DIR: "memory://",
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret-0123",
      BETTER_AUTH_URL: "http://localhost:3200",
      AUTH_RATE_LIMIT: "off",
      // The webhook test runs its receiver on localhost.
      WEBHOOK_ALLOW_PRIVATE: "1",
      DEMO_RESET_TOKEN: "e2e-demo-reset",
      // The tests create many accounts.
      PUBLIC_SIGN_UP: "on",
    },
    url: "http://localhost:3200/forms",
    reuseExistingServer: !process.env.CI,
  },
});
