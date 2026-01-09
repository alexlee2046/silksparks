import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined, // auto-detect in dev, limit in CI
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "playwright-report" }]]
    : "list",
  timeout: 120000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3101",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 30000,
    navigationTimeout: 60000,
    extraHTTPHeaders: {
      "X-E2E-Test": "true",
    },
  },
  projects: [
    // Smoke tests - quick validation of critical paths
    {
      name: "smoke",
      testMatch: [
        "**/auth/login.spec.ts",
        "**/shop/browse.spec.ts",
        "**/pages.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
      retries: 2,
    },
    // Full test suite
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    // Mobile tests
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
    // Admin tests - separate project for admin-only tests
    {
      name: "admin",
      testMatch: "**/admin-tests/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // AI feature tests
    {
      name: "ai",
      testMatch: "**/ai/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      timeout: 180000, // AI tests may take longer
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
