import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.ts — M06 E2E + a11y test configuration
 *
 * ADR-004: Playwright added at M06 (not M01) to avoid carrying the dep
 * tree during the Vitest-only development phase.
 *
 * Two browser projects: Chromium + WebKit (M06 AC-1).
 * baseURL = localhost:3001 (matches astro.config.mjs server.port).
 * webServer starts pnpm dev and waits for the server to be ready.
 *
 * Run: pnpm test:e2e
 * A11y subset: pnpm test:a11y
 * Lighthouse: pnpm test:lighthouse
 *
 * First-time setup (after pnpm install):
 *   pnpm exec playwright install chromium webkit
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
