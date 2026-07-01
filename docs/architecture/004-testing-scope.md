# ADR-004 — Testing scope: Vitest unit tests for `src/lib/**`; Playwright deferred to M06

**Status:** Accepted  
**Date:** 2026-06-29  
**Milestone:** M01

## Context

The spec requires test coverage for the contact form flow (M05) and the i18n / env modules (M01). The platform lock (`STACK.md`) does not mandate a specific test runner but specifies Node 24+ and pnpm. Playwright e2e is the standard for UI testing in this project class but requires a running server and real page content — it is not meaningful until M03+ when page content is implemented.

## Decision

Use **Vitest 2** (`vitest`, `@vitest/coverage-v8`) for all unit and integration tests under `src/lib/`. Playwright e2e tests are deferred to M06 (QA milestone) when `qa-engineer` runs the full test suite.

Vitest scope at M01:
- `src/lib/env.test.ts` — 8 tests covering required env var validation, optional env defaults, and provided values. Uses `vi.stubEnv` + `vi.resetModules()` for isolation.
- `src/lib/i18n.test.ts` — 9 tests covering bundle loading, caching, `getString` navigation, Korean text, missing-key and non-string-value errors, `assertParity` passing.

Vitest configuration (`vitest.config.ts`):
- `environment: "node"` — no DOM simulation needed for lib modules.
- Coverage provider: `@vitest/coverage-v8` targeting `src/lib/**` and `src/content/**`.
- No `globals: true` — explicit imports (`describe`, `it`, `expect`, `vi`) keep test files unambiguous.

M05 adds `src/lib/validation.test.ts` and `src/lib/resend.test.ts`; M06 (QA) adds Playwright e2e.

## Consequences

**Positive:**
- Vitest shares the same module resolution as Vite/Astro — no separate tsconfig or transform pipeline for tests.
- `vi.stubEnv` / `vi.resetModules()` pattern for env testing is idiomatic Vitest and avoids test-order dependencies.
- Fast: 17 tests run in ~900ms including cold-start transform.
- Coverage report available via `pnpm test:coverage` for CI gate at M06.

**Negative:**
- No browser-level tests at M01 — layout, nav, and i18n routing can only be verified by `pnpm dev` + manual check until Playwright is added.
- The `vi.resetModules()` pattern requires tests to `await import(...)` modules inside test bodies, which is less ergonomic than top-level imports. This is unavoidable for singleton modules like `env.ts` that read env at module load.

## Alternatives considered

- Jest — rejected. No native ESM + TypeScript support without transform config; Vitest is the idiomatic choice for Astro/Vite projects.
- Node built-in `node:test` — rejected. No `vi.stubEnv` equivalent; would require manual env mutation + restore boilerplate.
- Playwright component testing at M01 — rejected. Requires real HTML components to exist; premature at scaffold stage.
