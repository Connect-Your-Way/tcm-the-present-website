# ADR-002 — Resend client surface: thin module in `src/lib/resend.ts`

**Status:** Accepted  
**Date:** 2026-06-29  
**Milestone:** M01 (stub), M05 (full implementation)

## Context

The spec (§05 backend API, §08 integrations) requires email delivery via Resend. The Resend SDK (`resend` npm package) provides a typed client. We need to decide where the Resend client is instantiated and how it is exposed to the contact-form handler.

## Decision

Wrap the Resend SDK behind a single thin module `src/lib/resend.ts` that exports one async function:

```typescript
export async function sendContactEmail(input: ResendInput): Promise<ResendResult>
```

The module:
- Reads `env.RESEND_API_KEY` and `env.RESEND_FROM_ADDRESS` from the already-validated `src/lib/env.ts` singleton — never reads `process.env` directly.
- Instantiates the Resend client lazily (inside the function, not at module load) so tests can stub `env` without a live API key.
- Returns a typed `ResendResult` discriminated union (`{ ok: true; id: string } | { ok: false; code: string; message: string }`).
- Is the **only** import site for the `resend` package — the API route handler does not import `resend` directly.

At M01 the implementation is a stub (throws `NOT_IMPLEMENTED`). M05 replaces the stub body.

## Consequences

**Positive:**
- The API route handler (`/api/contact`) depends only on the `ResendInput`/`ResendResult` types, not on the `resend` SDK types — the contact handler is testable with a mocked `sendContactEmail`.
- Resend API key validation is co-located with SDK instantiation; a missing key surfaces at module load of `resend.ts`, not at request time.
- M05 work is isolated to one file (`resend.ts`) without touching the contact handler.

**Negative:**
- An extra indirection layer for a simple email call. For a more complex email system (templates, multiple sender addresses, webhooks) the thin wrapper would need to grow into a service class.

## Alternatives considered

- Import `resend` directly in `/api/contact.ts` — rejected. Spreads SDK coupling and makes unit-testing the contact handler without a live Resend key impossible.
- HTTP `fetch` against the Resend REST API directly (no SDK) — rejected. The SDK provides typed error handling and is already in the locked stack (`STACK.md` does not exclude it; it is a first-party Resend integration per §08).
