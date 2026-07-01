---
milestone_id: M01
title: Project scaffold — bilingual routing, design tokens, layout shell, lib skeletons
completed_at: 2026-06-29T13:40:00+00:00
spec_refs:
  - 01-system-overview/
  - 02-functional-description/
  - 04-api-frontend/
  - 05-api-backend/
  - 06-specifications-by-screen/
code_paths:
  - prod/projects/tcm-the-present/astro.config.mjs
  - prod/projects/tcm-the-present/package.json
  - prod/projects/tcm-the-present/tsconfig.json
  - prod/projects/tcm-the-present/vitest.config.ts
  - prod/projects/tcm-the-present/src/styles/
  - prod/projects/tcm-the-present/src/i18n/
  - prod/projects/tcm-the-present/src/lib/
  - prod/projects/tcm-the-present/src/layouts/
  - prod/projects/tcm-the-present/src/components/
  - prod/projects/tcm-the-present/src/pages/
  - prod/projects/tcm-the-present/scripts/
  - prod/projects/tcm-the-present/docs/architecture/
---

# M01 — Project scaffold: bilingual routing, design tokens, layout shell, lib skeletons

## What works now

The Astro 4 project is fully scaffolded and functional at `http://127.0.0.1:3001/`:

- **8 bilingual routes** pre-render statically: `/en/`, `/ko/`, `/en/clinic/`, `/ko/clinic/`, `/en/about/`, `/ko/about/`, `/en/contact/`, `/ko/contact/`. The root `/` redirects (302) to `/en/`.
- **Language toggle** switches between `/en/` and `/ko/` prefixed routes with accessible labels and 44×44 px touch targets (WCAG 2.1 AA).
- **hreflang alternates** (`en`, `ko`, `x-default`) are emitted in every page `<head>` for SEO correctness.
- **Design token system** (`src/styles/tokens.css`) — all F-07 colors, Inter/Cormorant Garamond/Noto Serif KR fonts, fluid type scale (`clamp()`-based), and spacing tokens accessible as CSS custom properties.
- **Bilingual i18n bundles** — 14 JSON files (7 EN + 7 KO namespaces) with 1:1 key parity verified by both a Vitest test and a prebuild parity script.
- **Layout, Header, Footer, LanguageToggle, PhonePill, HamburgerMenu components** — all render with live i18n strings; placeholders use `data-placeholder` attributes as specified by F-09.
- **`src/lib/env.ts`** — validates required env vars at module load; throws loudly on missing `RESEND_API_KEY` / `CONTACT_EMAIL`; provides defaults for optional vars.
- **`src/lib/i18n.ts`** — loads locale bundles via `fs.readFileSync` for cross-context compatibility (Astro build + Node parity script); `getString()` navigates dotted keys; `assertParity()` computes the symmetric difference of EN/KO key sets.
- **`POST /api/contact`** — stub returning 501 (M05 will implement it). The route shape exists for type-checking.
- **17 Vitest tests** passing (8 env + 9 i18n); prebuild i18n parity script wired.

## How it works

### Routing

`astro.config.mjs` uses `i18n.routing.prefixDefaultLocale: true`, meaning both `en` and `ko` appear as URL prefixes. Every page exports `export const prerender = true` (ADR-001: `output: "server"` + per-page prerender replaces deprecated `output: "hybrid"`). The root `src/pages/index.astro` is the sole server-rendered redirect page.

### i18n bundle loading

`src/lib/i18n.ts` uses `fs.readFileSync` with a path derived from `import.meta.url` to locate the JSON files. This works in both Astro's Vite build context and Node's `--experimental-strip-types` runner used by the parity script. Bundles are cached in a `Map<string, LocaleBundle>` — subsequent `loadLocaleBundle` calls for the same locale return the cached result.

### Design tokens

`src/styles/tokens.css` is the single source of truth for all design values. It is imported once in `src/layouts/Layout.astro`; Astro bundles it into the global stylesheet. Components reference tokens via `var(--token-name)` exclusively — no hard-coded color or sizing literals in component `<style>` blocks (ADR-003).

### Environment variables

`src/lib/env.ts` reads env vars once at module load and exports a frozen `env` object. Required vars (`RESEND_API_KEY`, `CONTACT_EMAIL`) throw on missing/empty; optional vars use `optionalEnv()` which handles both `undefined` and empty-string cases — the latter is important for `vi.stubEnv()` in tests.

### Testing

Vitest 2 with `@vitest/coverage-v8`. Tests use `vi.stubEnv` + `vi.resetModules()` + dynamic `await import()` for env isolation (ADR-004). The `check-i18n-parity.mjs` prebuild script runs via `node --experimental-strip-types` under the `prebuild` npm script, so `pnpm build` fails before Astro compiles if EN/KO bundles drift.

## Acceptance evidence

| AC | Criterion | Verification |
|---|---|---|
| AC-1 | `pnpm install` succeeds | Completed — Astro 4.16.19, @astrojs/node 8.3.4, vitest 2.1.9 installed |
| AC-2 | `pnpm dev` starts on port 3001 | Verified — `http://127.0.0.1:3001/` bound; Astro reported `Local http://127.0.0.1:3001/` |
| AC-3 | 8 locale-prefixed routes exist | Confirmed — `src/pages/en/` and `src/pages/ko/` each have index.astro, clinic.astro, about.astro, contact.astro with `prerender = true` |
| AC-4 | Layout, Header, Footer render with i18n strings | Confirmed — components import `loadLocaleBundle` + `getString`; tested manually via dev server |
| AC-5 | Design tokens wired | Confirmed — `tokens.css` on `:root`; imported in `Layout.astro`; all components use `var()` |
| AC-6 | `pnpm test` passes | Confirmed — 17/17 tests pass (8 env + 9 i18n) |
| AC-7 | i18n parity script exits 0 | Confirmed — `node --experimental-strip-types scripts/check-i18n-parity.mjs` outputs `[i18n] EN ↔ KO key parity OK ✓` |
| AC-8 | `env.ts` throws on missing required vars | Confirmed — `env.test.ts` tests "throws when RESEND_API_KEY is missing" and "throws when CONTACT_EMAIL is missing" pass |
| AC-9 | Stub routes return non-200 or stub notices | Confirmed — page stubs render `.stub-notice` elements; `/api/contact` returns 501 |

## Known limitations

- Page stubs render placeholder notices (`.stub-notice`) — real content is implemented at M02 (home), M03 (clinic), M04 (about + contact layout), M05 (contact form + email).
- Mobile hamburger nav uses an inline `<script>` for toggle logic. At M02+ the script will be revisited if the designer requires animation.
- Korean font (`Noto Serif KR`) is loaded via Google Fonts CDN — no self-hosting. This is acceptable for M01; M06 QA will flag if Lighthouse LCP is degraded.
- `GUIDELINE.md §12` proposed a 4-route client-side language toggle architecture that conflicts with the 8-route per-locale spec. Engineering spec (MILESTONES.md + S4-PLAN) takes precedence; per-locale routing is implemented as specified. The designer was not flagged as this is a binding spec decision.
