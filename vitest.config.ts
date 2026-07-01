import { defineConfig } from "vitest/config";

// ADR-004: Vitest + @vitest/coverage-v8 for unit tests
// Targets src/lib/** and src/content/** modules only
// Browser-side component tests deferred to Playwright at M06
// M05: coverage thresholds ratified (93% stmt / 92% branch measured at M05 close)
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/content/**"],
      exclude: ["src/lib/**/*.test.ts", "src/content/**/*.test.ts"],
      thresholds: {
        lines: 80,
        branches: 75,
      },
    },
  },
});
