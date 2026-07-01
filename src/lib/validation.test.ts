/**
 * src/lib/validation.test.ts — unit tests for validation.ts (§05 §5.4)
 *
 * Each validation rule has at least one passing + one failing test.
 * ADR-004: Vitest.
 */

import { describe, it, expect } from "vitest";
import { validateContactPayload } from "./validation.ts";

// ── Happy-path ─────────────────────────────────────────────────────────────────

describe("validateContactPayload — happy path", () => {
  it("returns ok=true for a valid payload", () => {
    const result = validateContactPayload({
      name: "Jane Smith",
      email: "jane@example.com",
      message: "Hello, I'd like to enquire.",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        message: "Hello, I'd like to enquire.",
      });
    }
  });

  it("trims leading/trailing whitespace on all fields", () => {
    const result = validateContactPayload({
      name: "  Jane  ",
      email: "  jane@example.com  ",
      message: "  Hello  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Jane");
      expect(result.value.email).toBe("jane@example.com");
      expect(result.value.message).toBe("Hello");
    }
  });

  it("silently ignores extra keys", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      message: "Hi",
      honeypot: "bot-input",
      subject: "Test",
    } as Record<string, unknown>);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value)).toEqual(["name", "email", "message"]);
    }
  });

  it("accepts a message with newlines", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      message: "Line 1\nLine 2\nLine 3",
    });
    expect(result.ok).toBe(true);
  });
});

// ── Body-level failures ────────────────────────────────────────────────────────

describe("validateContactPayload — body validation", () => {
  it("fails on null body", () => {
    const result = validateContactPayload(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("body");
      expect(result.failure.message).toBe("body must be a JSON object");
    }
  });

  it("fails on array body", () => {
    const result = validateContactPayload([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("body");
  });

  it("fails on primitive body", () => {
    const result = validateContactPayload("hello");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("body");
  });
});

// ── Name field ────────────────────────────────────────────────────────────────

describe("validateContactPayload — name field", () => {
  it("fails when name is missing", () => {
    const result = validateContactPayload({ email: "a@b.com", message: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("name");
      expect(result.failure.message).toBe("name is required");
    }
  });

  it("fails when name is whitespace-only", () => {
    const result = validateContactPayload({ name: "   ", email: "a@b.com", message: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("name");
  });

  it("fails when name exceeds 100 characters", () => {
    const result = validateContactPayload({
      name: "a".repeat(101),
      email: "a@b.com",
      message: "Hi",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("name");
      expect(result.failure.message).toBe("name must be at most 100 characters");
    }
  });

  it("accepts name exactly 100 characters long", () => {
    const result = validateContactPayload({
      name: "a".repeat(100),
      email: "a@b.com",
      message: "Hi",
    });
    expect(result.ok).toBe(true);
  });

  it("fails when name contains a newline", () => {
    const result = validateContactPayload({
      name: "Jane\nSmith",
      email: "a@b.com",
      message: "Hi",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("name");
      expect(result.failure.message).toBe("name must not contain newlines");
    }
  });
});

// ── Email field ───────────────────────────────────────────────────────────────

describe("validateContactPayload — email field", () => {
  it("fails when email is missing", () => {
    const result = validateContactPayload({ name: "Jane", message: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("email");
      expect(result.failure.message).toBe("email is required");
    }
  });

  it("fails when email is empty string", () => {
    const result = validateContactPayload({ name: "Jane", email: "", message: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("email");
  });

  it("fails when email has no @ sign", () => {
    const result = validateContactPayload({ name: "Jane", email: "notanemail", message: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("email");
      expect(result.failure.message).toBe("email must be a valid address");
    }
  });

  it("fails when email has no domain", () => {
    const result = validateContactPayload({ name: "Jane", email: "jane@", message: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("email");
  });

  it("fails when email exceeds 254 characters", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "a".repeat(250) + "@b.com",
      message: "Hi",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("email");
      expect(result.failure.message).toBe("email must be at most 254 characters");
    }
  });

  it("fails when email contains a newline", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@\nexample.com",
      message: "Hi",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("email");
  });

  it("accepts a valid email", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane+tag@sub.example.co.uk",
      message: "Hi",
    });
    expect(result.ok).toBe(true);
  });
});

// ── Message field ─────────────────────────────────────────────────────────────

describe("validateContactPayload — message field", () => {
  it("fails when message is missing", () => {
    const result = validateContactPayload({ name: "Jane", email: "jane@example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("message");
      expect(result.failure.message).toBe("message is required");
    }
  });

  it("fails when message is whitespace-only", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      message: "   ",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("message");
  });

  it("fails when message exceeds 2000 characters", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      message: "a".repeat(2001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("message");
      expect(result.failure.message).toBe("message must be at most 2000 characters");
    }
  });

  it("accepts a message exactly 2000 characters long", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      message: "a".repeat(2000),
    });
    expect(result.ok).toBe(true);
  });
});
