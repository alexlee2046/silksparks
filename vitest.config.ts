import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "tests/**/*.spec.{ts,tsx}"],
    exclude: [
      "tests/e2e/**",
      "tests/*.cjs",
      "tests/*.spec.ts",
      "node_modules/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        "context/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "services/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "pages/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.{ts,tsx}",
        "src/paraglide/**",
      ],
      thresholds: {
        // Start low, increase as coverage grows
        // Target: 80% → 100% over time
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
