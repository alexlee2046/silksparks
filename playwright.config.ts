import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined, // auto-detect in dev, limit in CI
  reporter: "list",
  timeout: 120000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3101",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
