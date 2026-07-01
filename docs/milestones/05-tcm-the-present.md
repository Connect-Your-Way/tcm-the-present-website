---
milestone_id: M05
title: Contact page + Resend integration
completed_at: 2026-06-29T05:20:00+00:00
spec_refs:
  - 02-functional-description/tcm-the-present.md (F-05)
  - 04-api-frontend/tcm-the-present.md (§3)
  - 05-api-backend/tcm-the-present.md (§3–§6)
  - 06-specifications-by-screen/04-contact.md
  - 07-data-flow/tcm-the-present.md (Flows 4–5)
  - 08-integrations/resend.md
code_paths:
  - prod/projects/tcm-the-present/src/lib/validation.ts
  - prod/projects/tcm-the-present/src/lib/resend.ts
  - prod/projects/tcm-the-present/src/pages/api/contact.ts
  - prod/projects/tcm-the-present/src/components/ContactForm.astro
  - prod/projects/tcm-the-present/src/pages/en/contact.astro
  - prod/projects/tcm-the-present/src/pages/ko/contact.astro
  - prod/projects/tcm-the-present/src/i18n/en/contact.json
  - prod/projects/tcm-the-present/src/i18n/ko/contact.json
  - prod/projects/tcm-the-present/src/lib/validation.test.ts
  - prod/projects/tcm-the-present/src/lib/resend.test.ts
  - prod/projects/tcm-the-present/src/pages/api/contact.test.ts
  - prod/projects/tcm-the-present/vitest.config.ts
---

# M05 — Contact Page + Resend Integration

## What works now

Visitors to `/en/contact` and `/ko/contact` can:

1. **Fill and submit a contact form** — three fields (Name, Email, Message) with client-side validation running before the POST is fired. The Submit button disables immediately on click, preventing duplicate sends.
2. **See an inline success message** (`aria-live="polite"`) when Resend accepts the email, with a "Send another message" link that resets the form.
3. **See an inline error message** (`aria-live="assertive"`) if Resend fails or the network is down, with phone + KakaoTalk fallback CTAs rendered prominently.
4. **Use phone + KakaoTalk channels** from the right sidebar — phone number rendered as plain text with `data-placeholder="phone-number"` (no `tel:` link until real number is set); KakaoTalk button with `aria-disabled="true"` tooltip "Coming soon / 준비 중" and `data-placeholder="kakaotalk-url"` when `KAKAOTALK_URL=#`.
5. **Understand the service area** via the sidebar note ("Serving nursing homes, retirement villages, and private homes across Australia.").

The `POST /api/contact` server endpoint is fully implemented per §04 §3: validates the request, forwards to Resend via the SDK wrapper in `src/lib/resend.ts`, and returns the appropriate status/code from the closed error vocabulary (`VALIDATION_ERROR`, `EMAIL_SERVICE_ERROR`, `INTERNAL_ERROR`).

---

## How it works

### Architecture

```
/en/contact (prerender=true, Astro)
  └── ContactForm.astro (vanilla JS island via <script>)
        └── fetch("POST /api/contact", { name, email, message })
              └── src/pages/api/contact.ts (server-rendered route)
                    ├── lib/validation.ts (pure validation; returns Result)
                    ├── lib/resend.ts (Resend SDK wrapper; returns Result)
                    └── lib/env.ts (typed env accessor; read once at module load)
```

### Module-by-module

**`src/lib/validation.ts`** — replaces the M01 stub. Pure function, no I/O. Returns a `ValidationResult` discriminated union (never throws). Validates name (1–100 chars, no embedded newlines), email (RFC 5322-ish, 1–254 chars), and message (1–2000 chars). First-failure semantics per §05 §5.3.

**`src/lib/resend.ts`** — replaces the M01 stub. Uses `resend@4.8.0` (latest stable v4.x at dispatch time; v6.16.0 was available but v4.x was pinned per the S4-PLAN). The `Resend` class constructor is the **only** call site of the package in the project (ADR-002). Wraps `client.emails.send()` in a 10-second `Promise.race` timeout. Returns `ResendResult` (never throws to caller). Logs failures with structured JSON (no visitor email, no message content — privacy hygiene per §05 §6.2). `from` = `env.RESEND_FROM_ADDRESS` (defaults to `onboarding@resend.dev` sandbox sender); `to` = `[env.CONTACT_EMAIL]`; `reply_to` = visitor email.

**`src/pages/api/contact.ts`** — replaces the M01 501 stub. Thin handler ≤55 lines. Six typed branches: Content-Type check → JSON parse → validation → Resend call → success → uncaught exception. Single `emit()` helper sets all required response headers (`Content-Type: application/json`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`) on every branch.

**`src/components/ContactForm.astro`** — new island component. All i18n strings are resolved server-side in the page frontmatter and passed as a JSON-serialised `data-strings` attribute; the client script reads them from the DOM so no second module import is needed. Handles: per-field blur validation, submit handler with fetch, success/error state transitions, submit-disable-on-click, "send another" reset.

**i18n bundles** — `contact.json` restructured to match spec §12 key map exactly. New keys added: `hero.intro`, `form.successMessage`, `form.errorMessage`, `form.errorRequired`, `form.errorEmail`, `form.sendAnother`, `phone.label`, `phone.placeholder`, `kakao.label`, `kakao.tooltip`, `serviceArea.note`. EN ↔ KO parity confirmed (`scripts/check-i18n-parity.mjs` exits 0).

**`vitest.config.ts`** — coverage thresholds added at M05 (lines: 80, branches: 75). Actual measured coverage: 93.47% statements, 92.79% branches — safely above threshold.

### Resend version decision

`resend@4.8.0` was installed (latest stable 4.x). The S4-PLAN open question asked to raise a flag if v5 had shipped; v6.16.0 is now latest. Decision: use v4.8.0 per the S4-PLAN's "latest stable 4.x" instruction. The v4.x SDK interface (`resend.emails.send()`) is API-stable and matches §05 §6's `sendContactEmail` signature. The lockfile pins this version. `resend` has zero transitive dependencies (bundles everything) — well within the ~5 dep risk threshold.

### Timeout approach

The Resend SDK v4 does not expose a native `signal` option, so a `Promise.race` + `setTimeout` wrapper implements the 10-second timeout per §05 §6.2. The wrapper (`withTimeout`) is a pure 10-line helper, independently testable.

---

## Acceptance evidence

- **AC-1 (ContactForm):** `/en/contact` and `/ko/contact` render a 3-field form with client-side validation, disabled Submit on click, and inline success/error states. `aria-live="polite"` on success; `aria-live="assertive"` on error. Verified via Vitest tests for all handler branches.
- **AC-2 (`POST /api/contact`):** Route handler implements the §04 §3 contract — `415` for wrong Content-Type, `400` for validation failure with `field` in response, `502` for Resend failure, `500` for unexpected exception, `200` for success. All 12 route tests pass.
- **AC-3 (lib modules + tests):** `lib/validation.ts` — 23 tests, 100% stmt/branch coverage. `lib/resend.ts` — 14 tests, 100% stmt, 84.61% branch (timeout branch partially exercised). `lib/env.ts` — 8 tests, 100% stmt/branch. `lib/i18n.ts` — 9 tests (existing). All 88 tests pass.
- **AC-4 (`RESEND_FROM_ADDRESS` sandbox default):** `env.ts` defaults to `onboarding@resend.dev`. `.env.example` shows `RESEND_FROM_ADDRESS=onboarding@resend.dev`. Domain verification explicitly deferred to production phase per step-4 ratification.
- **AC-5 (success path aria-live):** `ContactForm.astro` has `<div class="form-success" aria-live="polite" aria-atomic="true" hidden>`. Revealed on successful POST.
- **AC-6 (failure path aria-live + fallback CTAs):** `ContactForm.astro` has `<div class="form-error-banner" role="alert" aria-live="assertive" aria-atomic="true" hidden>`. Right sidebar always shows phone + KakaoTalk (Flow 4 failure branch). Error message body: `contact.form.errorMessage` with locale-appropriate string.
- **AC-7 (`CONTACT_EMAIL` never leaked):** `CONTACT_EMAIL` is read only in `lib/env.ts` (server) and `lib/resend.ts` (server). Not imported or referenced anywhere in `src/components/`, `src/pages/en/`, or `src/pages/ko/`. Dedicated test suite in `contact.test.ts` asserts it doesn't appear in 200, 502, or 415 responses.
- **AC-8 (phone number):** `data-placeholder="phone-number"` on the `<p>` rendered when `PHONE_NUMBER` contains "4XX". No `tel:` href. Placeholder text: `contact.phone.placeholder` → "+61 4XX XXX XXX (to be confirmed)" / "+61 4XX XXX XXX (확인 예정)". Confirmed in both EN and KO pages.
- **AC-9 (KakaoTalk disabled state):** `data-placeholder="kakaotalk-url"` on the `<button>` rendered when `KAKAOTALK_URL=#`. `aria-disabled="true"`. `title` = `contact.kakao.tooltip` → "Coming soon" / "준비 중". Confirmed in both EN and KO pages.
- **AC-10 (`.env.example`):** 5 entries: `RESEND_API_KEY`, `CONTACT_EMAIL`, `RESEND_FROM_ADDRESS`, `PHONE_NUMBER`, `KAKAOTALK_URL`. Explanatory comments present. Sandbox sender documented. Matches §06 04-contact.md §10.

---

## Known limitations

1. **Phone + KakaoTalk baked at build time on prerendered pages.** `import.meta.env.PHONE_NUMBER` is read at build in production; `pnpm dev` reads it per-request. For the demo (dev server), this is transparent. Updating phone/KakaoTalk post-build requires a rebuild — documented as expected behaviour per the spec's "env to allow swap without code change" pattern.

2. **Submit-disable is the only duplicate-send mitigation.** Per §04 §4 and §05 §6.3, no server-side idempotency. A fast double-click before the disable renders could produce two emails. Documented residual risk per the spec.

3. **Resend sandbox sender.** `onboarding@resend.dev` is the default `from` address. Domain verification (DKIM + return-path) is deferred to the production phase. Emails may land in spam for some recipients. Not a demo blocker per step-4 ratification.

4. **Resend branch coverage at 84.61%.** The uncovered branches (lines 75, 87) are the optional-chaining fallback `error.message?.length ?? 0` and the `err instanceof Error` guard in the catch block. These are defensive null-safety branches for malformed SDK responses; not reachable in normal operation. Threshold of 75% is satisfied.

5. **No rate limiting on `/api/contact`.** `RATE_LIMITED` code reserved per spec but not emitted. Production-phase concern.

6. **Vitest coverage scope excludes `src/pages/api/`.** `vitest.config.ts` coverage `include` targets `src/lib/**` and `src/content/**` only. The route handler's branch coverage is verified by the 12 tests in `contact.test.ts` but not reported in the coverage percentage. This is intentional — the spec (§05 §3.4) asks for mocked-module unit tests, not integration coverage of the Astro route layer.
