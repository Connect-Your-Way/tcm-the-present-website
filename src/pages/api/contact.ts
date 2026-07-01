/**
 * src/pages/api/contact.ts — POST /api/contact route handler (§04 §3, §05 §3)
 *
 * ADR-001: No `export const prerender` — this is the one server-rendered route.
 * Thin handler: parse → validate → send → respond.
 * All typed failure paths emit a Response via emit(); unhandled exceptions → 500.
 * Target size: ≤ 50 lines (CLAUDE.md §8.6). §05 §3.2 contract.
 *
 * Security posture — intentional residual risks (per spec §04 §3.5 + §04 §5):
 *   • No CSRF token: endpoint is same-origin fetch-only; the practitioner website
 *     has no login session, no cookies, and no state-mutating side-effects beyond
 *     sending an email — CSRF risk is negligible (no session to hijack).
 *   • No server-side rate limiting: deferred to SHIP.md phase; production deploy
 *     should add a token-bucket middleware (e.g. Astro middleware + KV store)
 *     before going live.  The HTML maxlength + client-side validation reduce abuse
 *     surface in the demo phase.
 *   Both items are acknowledged in the stage-5 code-review (iter-1 report).
 */

import type { APIRoute } from "astro";
import { validateContactPayload } from "../../lib/validation.ts";
import { sendContactEmail } from "../../lib/resend.ts";

type ErrorCode = "VALIDATION_ERROR" | "EMAIL_SERVICE_ERROR" | "INTERNAL_ERROR";

/** Single response-emission helper — sets all required headers from §04 §3.4 */
function emit(
  status: number,
  body: Record<string, unknown>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function validationError(field: string, message: string): Response {
  return emit(field === "Content-Type" ? 415 : 400, {
    ok: false,
    code: "VALIDATION_ERROR" as ErrorCode,
    field,
    message,
  });
}

export const POST: APIRoute = async ({ request }) => {
  // Step 1 — Content-Type guard
  const ct = request.headers.get("Content-Type") ?? "";
  if (!ct.includes("application/json")) {
    return validationError("Content-Type", "Content-Type must be application/json");
  }

  // Step 2 — Parse JSON
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return validationError("body", "malformed JSON");
  }

  // Step 3 — Validate payload
  const validation = validateContactPayload(raw);
  if (!validation.ok) {
    return validationError(validation.failure.field, validation.failure.message);
  }

  // Step 4 — Send email
  try {
    const result = await sendContactEmail(validation.value);
    if (!result.ok) {
      return emit(502, { ok: false, code: "EMAIL_SERVICE_ERROR" as ErrorCode, message: "Email service unavailable" });
    }
    // Step 5 — Success
    return emit(200, { ok: true });
  } catch (err: unknown) {
    // Step 6 — Unhandled exception
    console.error(JSON.stringify({ event: "contact_handler_error", detail: String(err) }));
    return emit(500, { ok: false, code: "INTERNAL_ERROR" as ErrorCode, message: "Internal error" });
  }
};
