import { defineConfig, devices } from "@playwright/test";

// PW_CHROMIUM_PATH lets a machine with a preinstalled Chromium skip the download.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Desktop Chrome"],
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
