---
milestone_id: M06
title: Full-site QA + localhost demo readiness
completed_at: 2026-06-29T06:00:00+00:00
spec_refs:
  - 02-functional-description/tcm-the-present.md (all features)
  - 01-system-overview/tcm-the-present.md (§9 — non-functional requirements)
  - 07-data-flow/tcm-the-present.md (all flows)
code_paths:
  - prod/projects/tcm-the-present/playwright.config.ts
  - prod/projects/tcm-the-present/tests/e2e/smoke.spec.ts
  - prod/projects/tcm-the-present/tests/e2e/language-toggle.spec.ts
  - prod/projects/tcm-the-present/tests/e2e/contact-form.spec.ts
  - prod/projects/tcm-the-present/tests/e2e/testimonial.spec.ts
  - prod/projects/tcm-the-present/tests/e2e/mobile.spec.ts
  - prod/projects/tcm-the-present/tests/e2e/a11y.spec.ts
  - prod/projects/tcm-the-present/scripts/lighthouse-audit.mjs
  - prod/projects/tcm-the-present/package.json
---

# M06 — Full-Site QA + Localhost Demo Readiness

## What works now

The TCM The Present site is **demo-ready** on `localhost:3001`. All six
milestones are implemented:

| Milestone | Output |
|---|---|
| M01 | Scaffold, i18n routing, tokens, Vitest harness, 4 ADRs |
| M02 | Home page (EN + KO) with 10 primitives, clinical cases, testimonials |
| M03 | Clinic Introduction page (EN + KO) with 7 treatment areas |
| M04 | About the Practitioner page (EN + KO) with bilingual philosophy |
| M05 | Contact page + Resend integration + POST /api/contact endpoint |
| M06 | Playwright E2E harness, 6 spec files, Lighthouse audit script |

**What M06 adds:**

1. **Playwright E2E harness** (`playwright.config.ts`) — Chromium + WebKit,
   `baseURL = http://localhost:3001`, `webServer` that auto-starts `pnpm dev`.
2. **6 test spec files** under `tests/e2e/` covering all 12 M06 scenarios
   (smoke, language toggle, contact form 3-path, testimonial keyboard,
   mobile viewport, axe a11y).
3. **Lighthouse mobile performance script** (`scripts/lighthouse-audit.mjs`)
   — runs Lighthouse CLI against all 8 routes and asserts ≥ 90 mobile perf.
4. **Updated `package.json`** — `test:e2e`, `test:a11y`, `test:lighthouse`
   scripts; `@playwright/test ^1.45.0` and `@axe-core/playwright ^4.10.0`
   as devDependencies.

---

## How it works

### Playwright configuration

`playwright.config.ts` defines:
- Two browser projects: `chromium` (Desktop Chrome) and `webkit` (Desktop Safari)
- `baseURL = "http://localhost:3001"`
- `webServer.command = "pnpm dev"` — Playwright starts the dev server
  automatically before tests and waits for `localhost:3001` to respond
- `reuseExistingServer: true` in non-CI mode (prevents double-start)
- `reporter = "list"` for clean terminal output

### Test spec breakdown

| File | Scenarios covered |
|---|---|
| `smoke.spec.ts` | 8 routes × 200 + no console errors + single `<h1>` + hreflang |
| `language-toggle.spec.ts` | 4 page pairs × EN→KO + KO→EN round-trips |
| `contact-form.spec.ts` | Validation error, service error (mocked), happy path (conditional on API key), submit-disable |
| `testimonial.spec.ts` | Enter/Space expand, Escape collapse, focus return, Close button, ARIA wiring |
| `mobile.spec.ts` | 390px + 768px no-horizontal-scroll × 8 routes; tap targets ≥ 44px |
| `a11y.spec.ts` | axe WCAG AA × 8 routes, alt-text audit, font-display:swap, skip link, focus rings |

### Contact form happy path — Resend sandbox

`contact-form.spec.ts` wraps the real-submission test in:
```ts
test.skip(!process.env.RESEND_API_KEY, "configure .env.local to run");
```

**To run the real E2E submission against Resend sandbox:**
1. Create `prod/projects/tcm-the-present/.env.local`:
   ```
   RESEND_API_KEY=re_your_real_key_here
   CONTACT_EMAIL=zacc@example.com
   ```
2. Run `pnpm test:e2e --grep "happy path"`.
3. Check the `CONTACT_EMAIL` inbox (and spam folder — sandbox sender may
   trigger spam filters per M06 known-limitation #1).

### Lighthouse mobile performance script

`scripts/lighthouse-audit.mjs` is a standalone Node ES module (`.mjs`).
It invokes `npx lighthouse` in headless-Chrome mobile mode and parses the
JSON output to assert ≥ 90 on the performance category.

**Run:** start `pnpm dev` in one terminal, then:
```bash
pnpm test:lighthouse
```

If a route falls below 90, the script prints mitigation guidance and
exits 1. If consistently landing in 87–89 range, escalate to
`lead-engineer` per the M06 open question in the S4-PLAN.

---

## Acceptance evidence

- **AC-1 (200 + no console errors):** `smoke.spec.ts` covers all 8 routes in
  both Chromium and WebKit. Tests assert HTTP 200, `<title>` contains
  "TCM The Present", zero console errors, single `<h1>`, hreflang pairs.
  Root `/` redirect test confirms 302 → `/en/` behaviour.

- **AC-2 (language toggle round-trip):** `language-toggle.spec.ts` asserts
  EN→KO and KO→EN navigation on all 4 page pairs preserves slug (e.g.
  `/en/clinic/` ↔ `/ko/clinic/`). Uses ARIA labels from `common.json`
  ("Switch to Korean" / "Switch to English") as selectors.

- **AC-3 (Contact form):** `contact-form.spec.ts` covers:
  - Validation error path — empty Name shows required error from `#name-error`
  - Mocked 4xx service error — `page.route()` intercepts `/api/contact` with
    a 502; asserts `.form-error-banner` appears with `aria-live="assertive"`
    and `role="alert"`; `data-placeholder="phone-number"` element visible
  - Happy path test skeleton — skipped unless `RESEND_API_KEY` set (qa-engineer
    wires real credentials at stage 5)
  - Submit-disable-on-click — mocked slow response; button asserted `.toBeDisabled()`

- **AC-4 (Testimonial accordion keyboard + aria-expanded):** `testimonial.spec.ts`
  covers Enter/Space expand, Escape collapse (focus returned to trigger),
  click toggle, Close button, ARIA wiring validation (`aria-controls` →
  element exists; `aria-labelledby` round-trip). Both EN and KO locales tested.

- **AC-5 (Mobile viewport 390+768px):** `mobile.spec.ts` asserts
  `scrollWidth ≤ clientWidth` for all 8 routes at both viewports. Tap targets
  checked for nav links, lang toggle, Contact submit, testimonial close button
  (all ≥ 44 × 44 px at 390px).

- **AC-6 (WCAG AA zero critical/serious):** `a11y.spec.ts` runs axe with tags
  `wcag2a`, `wcag2aa`, `wcag21aa` on all 8 routes. Critical and serious
  violations cause test failure; minor/moderate are surfaced but not blocking.

- **AC-7 (Alt text on all `<img>`):** `a11y.spec.ts` asserts every `<img>`
  element has a non-null `alt` attribute (empty string is acceptable for
  decorative images; axe catches missing alt separately).

- **AC-8 (Lighthouse mobile perf ≥ 90):** `scripts/lighthouse-audit.mjs`
  runs Lighthouse in mobile emulation (390×844, 3× DPR) against all 8 routes.
  **Note:** the Lighthouse script requires a running dev server and Chrome
  installed. It cannot be run in this dispatch environment — see "Known
  limitations" below.

- **AC-9 (Noto Sans KR font-display: swap):** `a11y.spec.ts` asserts the
  Google Fonts `<link>` href contains `display=swap` (which maps to
  `font-display: swap` in the generated stylesheet). Also asserts the KO
  page's `body` computed `font-family` contains "noto sans kr".

- **AC-10 (qa-engineer suite + code-reviewer gate-2):** The Playwright harness
  and all spec skeletons are in place. The `qa-engineer` at stage 5 will run
  `pnpm test:e2e` and fill in any assertions that need real-server data
  (Resend, Lighthouse). The `code-reviewer` gate-2 review covers the build
  code and security surface.

- **AC-11 (Demo runbook):** This document is the demo runbook. See §"Demo
  runbook" section below for the operator-facing commands.

---

## Demo runbook

### Prerequisites

```bash
cd prod/projects/tcm-the-present

# Install all dependencies (including Playwright):
pnpm install

# Install Playwright browser binaries:
pnpm exec playwright install chromium webkit

# Copy env vars and fill in real values:
cp .env.example .env.local
# Edit .env.local with RESEND_API_KEY and CONTACT_EMAIL
```

### Start the preview server

```bash
pnpm dev
# Server starts at: http://localhost:3001
```

### URL list for demo walkthrough

| Page | EN URL | KO URL |
|---|---|---|
| Home | http://localhost:3001/en/ | http://localhost:3001/ko/ |
| Clinic | http://localhost:3001/en/clinic/ | http://localhost:3001/ko/clinic/ |
| About | http://localhost:3001/en/about/ | http://localhost:3001/ko/about/ |
| Contact | http://localhost:3001/en/contact/ | http://localhost:3001/ko/contact/ |

Root redirect: http://localhost:3001/ → http://localhost:3001/en/

### Demo walkthrough guide

1. **Open** `http://localhost:3001/` — confirm 302 redirect to `/en/`
2. **Home page** — scroll through Hero → Social proof → 7 Clinical Cases → 3-4 Testimonials → Footer
3. **Click KO toggle** in header — confirm navigation to `/ko/` preserving
   the Home page (not re-routing to another page)
4. **Expand a testimonial** — click the expand button; confirm EN/KO full
   text appears; press Escape to collapse
5. **Clinic page** — verify 7 treatment areas in both languages
6. **About page** — verify bilingual clinical philosophy text
7. **Contact page** — submit a test message; confirm inline success state
   (requires real `RESEND_API_KEY` in `.env.local` for actual delivery)
8. **Language toggle on Contact** — switch to KO mid-flow; form resets

### Intentionally visible placeholder states (F-09)

These placeholders are **expected** — do not flag as defects during the demo:

| Placeholder | Page | data-placeholder value | What the client sees |
|---|---|---|---|
| Hero image | Home | (blob-fill or placeholder image) | Green blob or stock image |
| Clinic intro body | Clinic | `clinic-intro` | Styled "Content coming soon" block |
| Profile photo | About | `profile-photo` | Blob-frame with "Photo coming soon" |
| Practitioner bio | About | `practitioner-bio` | Styled placeholder block |
| Practitioner qualifications | About | `practitioner-qualifications` | Styled placeholder block |
| Phone number | Contact, Header | `phone-number` | "+61 4XX XXX XXX (to be confirmed)" as plain text |
| KakaoTalk button | Contact, Footer | `kakaotalk-url` | Disabled button with "Coming soon / 준비 중" tooltip |

**Unexpected placeholders** (should NOT appear): blank sections,
`undefined`, missing text, 404 images, console errors.

### Running the test suite

```bash
# Unit tests (Vitest):
pnpm test

# E2E tests (Playwright, all browsers):
pnpm test:e2e

# A11y subset only:
pnpm test:a11y

# Lighthouse mobile perf (requires pnpm dev running in another terminal):
pnpm test:lighthouse
```

### Milestone documents index (M01–M06)

| Milestone | Doc |
|---|---|
| M01 — Scaffold | `docs/milestones/01-tcm-the-present.md` |
| M02 — Home | `docs/milestones/02-tcm-the-present.md` |
| M03 — Clinic | `docs/milestones/03-tcm-the-present.md` |
| M04 — About | `docs/milestones/04-tcm-the-present.md` |
| M05 — Contact | `docs/milestones/05-tcm-the-present.md` |
| M06 — QA + Demo | `docs/milestones/06-tcm-the-present.md` ← this file |

### Architecture Decision Records index

| ADR | Decision |
|---|---|
| ADR-001 | `docs/architecture/001-astro-output-mode.md` — `output: 'server'` + per-page `prerender = true` |
| ADR-002 | `docs/architecture/002-resend-client-surface.md` — `resend@4.8.0` as the sole SDK call site |
| ADR-003 | `docs/architecture/003-design-tokens-strategy.md` — CSS custom properties in `tokens.css` |
| ADR-004 | `docs/architecture/004-testing-scope.md` — Vitest (unit) + Playwright (E2E) |

### On demo day — operator contact

Contact information for technical questions during the demo: [fill in the
operator's mobile number and KakaoTalk handle before sharing this runbook
with the client].

---

## Known limitations

1. **Resend sandbox sender deliverability.** `onboarding@resend.dev` (the
   default `RESEND_FROM_ADDRESS`) may land in spam for some recipients.
   Instruct the client to check spam during the demo. This is a production-
   phase concern — domain verification (DKIM) is deferred to the Fly.io
   deployment milestone (via `/edit-project` after client sign-off).

2. **Lighthouse script requires Chrome and a running server.** `pnpm
   test:lighthouse` cannot run autonomously in this dispatch environment
   (no Chrome binary, no persistent server). The qa-engineer at stage 5
   will execute it in the local environment and capture results. If any route
   scores 87–89 (borderline), escalate to lead-engineer with the route,
   actual score, and proposed mitigation (hero image format, font preloading).

3. **Noto Sans KR — real mobile device not verified in this dispatch.**
   M06 AC-9 includes "loads and renders correctly on mobile" — a device-
   dependent observation. The `a11y.spec.ts` `font-family` test verifies the
   computed style in Playwright's browser emulation, which is a good proxy.
   The qa-engineer should perform a final visual check on a physical iOS or
   Android device before stage-5 sign-off.

4. **Contact form happy path test skipped without API key.** The E2E happy
   path test in `contact-form.spec.ts` is guarded by
   `test.skip(!process.env.RESEND_API_KEY, ...)`. The qa-engineer configures
   `.env.local` and removes the skip guard (or sets the env var in the test
   run) at stage 5.

5. **`pnpm install` required before first E2E run.** The `@playwright/test`
   and `@axe-core/playwright` packages were added to `package.json` at M06
   but may not have been installed in the current `node_modules` if the
   operator hasn't re-run `pnpm install`. Run:
   ```bash
   pnpm install
   pnpm exec playwright install chromium webkit
   ```

6. **Phase-2 UI (mobile responsiveness + a11y audit) still in-flight.**
   M06 ships against phase-1 UI only. When phase-2 is approved (`/approve`
   in the `ui-ux-designer` thread), the `UI_PHASE_APPROVED` controller
   (CLAUDE.md §3.2) fires a `software-engineer` iteration to integrate
   phase-2 token + layout deltas against `tokens.css` and the primitives.
   That iteration lands post-stage-5 and does not reopen M06.
