/**
 * src/lib/env.test.ts — smoke tests for env.ts (§05 §4.3)
 * ADR-004: Vitest unit tests; mocks via vi.stubEnv + vi.resetModules.
 */

import { describe, it, expect, afterEach, vi } from "vitest";

// Restore env stubs between tests
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env — required variables", () => {
  it("throws on missing RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    await expect(import("./env.ts")).rejects.toThrow(/RESEND_API_KEY/);
  });

  it("throws on missing CONTACT_EMAIL", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "");
    await expect(import("./env.ts")).rejects.toThrow(/CONTACT_EMAIL/);
  });
});

describe("env — optional variables with defaults", () => {
  it("defaults PHONE_NUMBER when unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "contact@example.com");
    vi.stubEnv("PHONE_NUMBER", "");
    const { env } = await import("./env.ts");
    expect(env.PHONE_NUMBER).toBe("+61 4XX XXX XXX");
  });

  it("defaults KAKAOTALK_URL to '#' when unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "contact@example.com");
    vi.stubEnv("KAKAOTALK_URL", "");
    const { env } = await import("./env.ts");
    expect(env.KAKAOTALK_URL).toBe("#");
  });

  it("defaults RESEND_FROM_ADDRESS to sandbox sender when unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "contact@example.com");
    vi.stubEnv("RESEND_FROM_ADDRESS", "");
    const { env } = await import("./env.ts");
    expect(env.RESEND_FROM_ADDRESS).toBe("onboarding@resend.dev");
  });

  it("defaults NODE_ENV to 'development' when unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "contact@example.com");
    vi.stubEnv("NODE_ENV", "");
    const { env } = await import("./env.ts");
    expect(env.NODE_ENV).toBe("development");
  });
});

describe("env — loads provided values", () => {
  it("returns provided PHONE_NUMBER", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "contact@example.com");
    vi.stubEnv("PHONE_NUMBER", "+61 400 000 001");
    const { env } = await import("./env.ts");
    expect(env.PHONE_NUMBER).toBe("+61 400 000 001");
  });

  it("returns provided KAKAOTALK_URL", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("CONTACT_EMAIL", "contact@example.com");
    vi.stubEnv("KAKAOTALK_URL", "https://open.kakao.com/o/test");
    const { env } = await import("./env.ts");
    expect(env.KAKAOTALK_URL).toBe("https://open.kakao.com/o/test");
  });
});
