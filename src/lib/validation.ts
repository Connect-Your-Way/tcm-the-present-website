/**
 * src/lib/validation.ts — contact payload validation (§05 §5)
 *
 * Pure functions; no I/O, no env access, no side effects.
 * Returns on the first failure — does not aggregate (§05 §5.3).
 * Rules match §04 §3.1 exactly.
 */

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

export type ValidationFailure = {
  field: "name" | "email" | "message" | "body";
  message: string;
};

export type ValidationResult =
  | { ok: true; value: ContactPayload }
  | { ok: false; failure: ValidationFailure };

// Email pattern per §04 §3.1: permissive RFC 5322-ish (no embedded whitespace or @)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a raw request body as a ContactPayload.
 * Returns a typed Result — never throws (§05 §5.3).
 */
export function validateContactPayload(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, failure: { field: "body", message: "body must be a JSON object" } };
  }

  const obj = raw as Record<string, unknown>;

  // ── name ──────────────────────────────────────────────────────────────────
  const rawName = typeof obj["name"] === "string" ? obj["name"].trim() : "";
  if (rawName.length === 0) {
    return { ok: false, failure: { field: "name", message: "name is required" } };
  }
  if (rawName.includes("\n")) {
    return { ok: false, failure: { field: "name", message: "name must not contain newlines" } };
  }
  if (rawName.length > 100) {
    return { ok: false, failure: { field: "name", message: "name must be at most 100 characters" } };
  }

  // ── email ─────────────────────────────────────────────────────────────────
  const rawEmail = typeof obj["email"] === "string" ? obj["email"].trim() : "";
  if (rawEmail.length === 0) {
    return { ok: false, failure: { field: "email", message: "email is required" } };
  }
  if (rawEmail.includes("\n")) {
    return { ok: false, failure: { field: "email", message: "email must be a valid address" } };
  }
  if (rawEmail.length > 254) {
    return { ok: false, failure: { field: "email", message: "email must be at most 254 characters" } };
  }
  if (!EMAIL_RE.test(rawEmail)) {
    return { ok: false, failure: { field: "email", message: "email must be a valid address" } };
  }

  // ── message ───────────────────────────────────────────────────────────────
  const rawMessage = typeof obj["message"] === "string" ? obj["message"].trim() : "";
  if (rawMessage.length === 0) {
    return { ok: false, failure: { field: "message", message: "message is required" } };
  }
  if (rawMessage.length > 2000) {
    return { ok: false, failure: { field: "message", message: "message must be at most 2000 characters" } };
  }

  return {
    ok: true,
    value: { name: rawName, email: rawEmail, message: rawMessage },
  };
}
