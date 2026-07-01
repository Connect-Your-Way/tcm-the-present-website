/**
 * src/lib/resend.test.ts — unit tests for resend.ts (§05 §6.4)
 *
 * Mocks the `resend` module so no real HTTP calls are made.
 * Tests cover: 200, 4xx, 5xx, network error, and timeout branches.
 * ADR-004: Vitest.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Module mocks (declared before imports) ────────────────────────────────────

// Mock env to avoid needing real env vars
vi.mock("./env.ts", () => ({
  env: {
    RESEND_API_KEY: "re_test_key",
    CONTACT_EMAIL: "practitioner@example.com",
    RESEND_FROM_ADDRESS: "onboarding@resend.dev",
    PHONE_NUMBER: "+61 4XX XXX XXX",
    KAKAOTALK_URL: "#",
    SITE_URL: "http://localhost:3001",
    NODE_ENV: "test",
  },
}));

// Hoisted mock for the Resend SDK send method
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockSend },
  })),
}));

// Now import the module under test (after mocks are set up)
import { sendContactEmail } from "./resend.ts";

const VALID_INPUT = {
  name: "Jane Smith",
  email: "jane@example.com",
  message: "Hello, I'd like to enquire.",
};

beforeEach(() => {
  mockSend.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Success ───────────────────────────────────────────────────────────────────

describe("sendContactEmail — success path", () => {
  it("returns {ok: true, id} when Resend returns 2xx with an id", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_123abc" }, error: null });
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.id).toBe("email_123abc");
  });

  it("includes Authorization header via the Resend constructor (API key check)", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_abc" }, error: null });
    await sendContactEmail(VALID_INPUT);
    // The Resend constructor was called with the API key from env
    const { Resend } = await import("resend");
    expect(Resend).toHaveBeenCalledWith("re_test_key");
  });

  it("sends to env.CONTACT_EMAIL (not exposed to caller)", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_xyz" }, error: null });
    await sendContactEmail(VALID_INPUT);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["practitioner@example.com"] })
    );
  });

  it("uses env.RESEND_FROM_ADDRESS as the sender", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_xyz" }, error: null });
    await sendContactEmail(VALID_INPUT);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "onboarding@resend.dev" })
    );
  });

  it("uses visitor email as reply_to", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_xyz" }, error: null });
    await sendContactEmail(VALID_INPUT);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ reply_to: "jane@example.com" })
    );
  });

  it("does not log visitor email or message in the success path", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_xyz" }, error: null });
    const spy = vi.spyOn(console, "error");
    await sendContactEmail(VALID_INPUT);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── SDK error path ─────────────────────────────────────────────────────────────

describe("sendContactEmail — SDK error (non-2xx from Resend)", () => {
  it("returns EMAIL_SERVICE_ERROR when SDK returns an error object (4xx)", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Invalid email address" },
    });
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EMAIL_SERVICE_ERROR");
  });

  it("returns EMAIL_SERVICE_ERROR when SDK returns a 422 error", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "missing_required_field", message: "from is required" },
    });
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EMAIL_SERVICE_ERROR");
  });

  it("returns EMAIL_SERVICE_ERROR when SDK returns a 429 error", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "rate_limit_exceeded", message: "Too many requests" },
    });
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EMAIL_SERVICE_ERROR");
  });

  it("returns EMAIL_SERVICE_ERROR when SDK returns a 500 error", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "internal_server_error", message: "Server error" },
    });
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.ok).toBe(false);
  });

  it("logs the error event without logging visitor email or message", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "bad" },
    });
    const spy = vi.spyOn(console, "error");
    await sendContactEmail(VALID_INPUT);
    expect(spy).toHaveBeenCalled();
    // Confirm CONTACT_EMAIL is NOT in the logged string
    const loggedStr = spy.mock.calls[0]?.join(" ") ?? "";
    expect(loggedStr).not.toContain("practitioner@example.com");
    expect(loggedStr).not.toContain("jane@example.com");
    expect(loggedStr).not.toContain("Hello, I'd like to enquire.");
  });
});

// ── Network / exception path ───────────────────────────────────────────────────

describe("sendContactEmail — network / unexpected exception", () => {
  it("returns EMAIL_SERVICE_ERROR on network error (rejected promise)", async () => {
    mockSend.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EMAIL_SERVICE_ERROR");
  });

  it("never rethrows — returns a typed Result even on unexpected error", async () => {
    mockSend.mockRejectedValueOnce(new TypeError("Unexpected thing"));
    await expect(sendContactEmail(VALID_INPUT)).resolves.toMatchObject({
      ok: false,
      code: "EMAIL_SERVICE_ERROR",
    });
  });
});

// ── Timeout path ───────────────────────────────────────────────────────────────

describe("sendContactEmail — timeout", () => {
  it("returns EMAIL_SERVICE_ERROR when Resend call exceeds 10 s", async () => {
    vi.useFakeTimers();
    // The send never resolves naturally — fake timers advance past 10s
    mockSend.mockImplementationOnce(
      () => new Promise((_resolve) => { /* hangs */ })
    );
    const resultPromise = sendContactEmail(VALID_INPUT);
    // Fast-forward 11 seconds
    vi.advanceTimersByTime(11_000);
    const result = await resultPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EMAIL_SERVICE_ERROR");
    vi.useRealTimers();
  }, 20_000);
});
