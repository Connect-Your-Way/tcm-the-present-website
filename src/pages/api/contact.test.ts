/**
 * src/pages/api/contact.test.ts — unit tests for POST /api/contact (§05 §3.4)
 *
 * Tests every branch in the route handler (§05 §3.2):
 *   1. Content-Type guard → 415
 *   2. Malformed JSON → 400
 *   3. Validation failure → 400
 *   4. Resend failure → 502
 *   5. Unexpected exception → 500
 *   6. Success → 200
 * Also asserts CONTACT_EMAIL never in any response body (§05 §3.4 critical).
 * ADR-004: Vitest. vi.hoisted() ensures mock factories can reference local vars.
 * Note: responses are cloned before body consumption to avoid "body consumed" errors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Hoisted mock factories (must precede vi.mock calls) ───────────────────────

const { mockValidate, mockSendEmail } = vi.hoisted(() => ({
  mockValidate: vi.fn(),
  mockSendEmail: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("../../lib/env.ts", () => ({
  env: {
    RESEND_API_KEY: "re_test_key",
    CONTACT_EMAIL: "secret-practitioner@example.com",
    RESEND_FROM_ADDRESS: "onboarding@resend.dev",
    PHONE_NUMBER: "+61 4XX XXX XXX",
    KAKAOTALK_URL: "#",
    NODE_ENV: "test",
  },
}));

vi.mock("../../lib/validation.ts", () => ({
  validateContactPayload: mockValidate,
}));

vi.mock("../../lib/resend.ts", () => ({
  sendContactEmail: mockSendEmail,
}));

import { POST } from "./contact.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  body: unknown,
  contentType = "application/json"
): Parameters<typeof POST>[0] {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
  return { request: new Request("http://localhost/api/contact", init) } as Parameters<typeof POST>[0];
}

/**
 * Parse a response body + check for CONTACT_EMAIL leak.
 * Clones first so reading json doesn't consume for the leak check.
 */
async function parseResponse(res: Response): Promise<{
  status: number;
  body: Record<string, unknown>;
  text: string;
}> {
  const clone = res.clone();
  const body = await clone.json() as Record<string, unknown>;
  const text = JSON.stringify(body);
  return { status: res.status, body, text };
}

function assertRequiredHeaders(res: Response): void {
  expect(res.headers.get("Content-Type")).toContain("application/json");
  expect(res.headers.get("Cache-Control")).toBe("no-store");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
}

const VALID_PAYLOAD = {
  name: "Jane Smith",
  email: "jane@example.com",
  message: "Hello!",
};

const SECRET_EMAIL = "secret-practitioner@example.com";

beforeEach(() => {
  mockValidate.mockReset();
  mockSendEmail.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Content-Type guard ─────────────────────────────────────────────────────────

describe("POST /api/contact — Content-Type guard", () => {
  it("returns 415 when Content-Type is not application/json", async () => {
    const res = await POST(makeRequest(VALID_PAYLOAD, "text/plain"));
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(415);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.field).toBe("Content-Type");
    assertRequiredHeaders(res);
    expect(text).not.toContain(SECRET_EMAIL);
  });
});

// ── JSON parse failure ─────────────────────────────────────────────────────────

describe("POST /api/contact — JSON parse failure", () => {
  it("returns 400 when body is malformed JSON", async () => {
    const ctx = {
      request: new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{{not json}}",
      }),
    } as Parameters<typeof POST>[0];
    const res = await POST(ctx);
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.field).toBe("body");
    assertRequiredHeaders(res);
    expect(text).not.toContain(SECRET_EMAIL);
  });
});

// ── Validation failures ────────────────────────────────────────────────────────

describe("POST /api/contact — validation failures", () => {
  it("returns 400 VALIDATION_ERROR on name failure", async () => {
    mockValidate.mockReturnValueOnce({
      ok: false,
      failure: { field: "name", message: "name is required" },
    });
    const res = await POST(makeRequest({ name: "", email: "x@x.com", message: "Hi" }));
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.field).toBe("name");
    assertRequiredHeaders(res);
    expect(text).not.toContain(SECRET_EMAIL);
  });

  it("returns 400 VALIDATION_ERROR on email failure", async () => {
    mockValidate.mockReturnValueOnce({
      ok: false,
      failure: { field: "email", message: "email must be a valid address" },
    });
    const res = await POST(makeRequest({ name: "Jane", email: "notanemail", message: "Hi" }));
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(400);
    expect(body.field).toBe("email");
    expect(text).not.toContain(SECRET_EMAIL);
  });

  it("returns 400 VALIDATION_ERROR on message failure", async () => {
    mockValidate.mockReturnValueOnce({
      ok: false,
      failure: { field: "message", message: "message is required" },
    });
    const res = await POST(makeRequest({ name: "Jane", email: "jane@x.com", message: "" }));
    const { status, text } = await parseResponse(res);
    expect(status).toBe(400);
    expect(text).not.toContain(SECRET_EMAIL);
  });
});

// ── Resend failure ─────────────────────────────────────────────────────────────

describe("POST /api/contact — Resend failure", () => {
  it("returns 502 EMAIL_SERVICE_ERROR when sendContactEmail returns failure", async () => {
    mockValidate.mockReturnValueOnce({ ok: true, value: VALID_PAYLOAD });
    mockSendEmail.mockResolvedValueOnce({ ok: false, code: "EMAIL_SERVICE_ERROR" });
    const res = await POST(makeRequest(VALID_PAYLOAD));
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("EMAIL_SERVICE_ERROR");
    assertRequiredHeaders(res);
    expect(text).not.toContain(SECRET_EMAIL);
  });
});

// ── Unexpected exception ───────────────────────────────────────────────────────

describe("POST /api/contact — unexpected exception", () => {
  it("returns 500 INTERNAL_ERROR when sendContactEmail throws", async () => {
    mockValidate.mockReturnValueOnce({ ok: true, value: VALID_PAYLOAD });
    mockSendEmail.mockRejectedValueOnce(new Error("Something totally unexpected"));
    const res = await POST(makeRequest(VALID_PAYLOAD));
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("INTERNAL_ERROR");
    assertRequiredHeaders(res);
    expect(text).not.toContain(SECRET_EMAIL);
  });
});

// ── Success ────────────────────────────────────────────────────────────────────

describe("POST /api/contact — success", () => {
  it("returns 200 {ok:true} on happy path", async () => {
    mockValidate.mockReturnValueOnce({ ok: true, value: VALID_PAYLOAD });
    mockSendEmail.mockResolvedValueOnce({ ok: true, id: "email_success_123" });
    const res = await POST(makeRequest(VALID_PAYLOAD));
    const { status, body, text } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    assertRequiredHeaders(res);
    expect(text).not.toContain(SECRET_EMAIL);
  });

  it("passes the validated payload to sendContactEmail", async () => {
    mockValidate.mockReturnValueOnce({ ok: true, value: VALID_PAYLOAD });
    mockSendEmail.mockResolvedValueOnce({ ok: true, id: "email_abc" });
    await POST(makeRequest(VALID_PAYLOAD));
    expect(mockSendEmail).toHaveBeenCalledWith(VALID_PAYLOAD);
  });
});

// ── CONTACT_EMAIL never leaked (dedicated suite) ───────────────────────────────

describe("POST /api/contact — CONTACT_EMAIL never in responses", () => {
  it("not in 200 success response", async () => {
    mockValidate.mockReturnValueOnce({ ok: true, value: VALID_PAYLOAD });
    mockSendEmail.mockResolvedValueOnce({ ok: true, id: "email_123" });
    const res = await POST(makeRequest(VALID_PAYLOAD));
    const text = await res.text();
    expect(text).not.toContain(SECRET_EMAIL);
  });

  it("not in 502 failure response", async () => {
    mockValidate.mockReturnValueOnce({ ok: true, value: VALID_PAYLOAD });
    mockSendEmail.mockResolvedValueOnce({ ok: false, code: "EMAIL_SERVICE_ERROR" });
    const res = await POST(makeRequest(VALID_PAYLOAD));
    const text = await res.text();
    expect(text).not.toContain(SECRET_EMAIL);
  });

  it("not in 415 Content-Type response", async () => {
    const res = await POST(makeRequest(VALID_PAYLOAD, "text/plain"));
    const text = await res.text();
    expect(text).not.toContain(SECRET_EMAIL);
  });
});
