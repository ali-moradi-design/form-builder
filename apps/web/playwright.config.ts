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
    url: "http://localhost:3200/forms",
    reuseExistingServer: !process.env.CI,
  },
});
