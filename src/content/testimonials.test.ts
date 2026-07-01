/**
 * src/content/testimonials.test.ts — unit tests for the testimonials loader (§05 §8.3)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Test 1: Demo JSON loads without throwing ──────────────────────────────────
describe("testimonials loader — happy path", () => {
  it("loads the demo testimonials.json without throwing", async () => {
    const { testimonials } = await import("./testimonials.ts");
    expect(Array.isArray(testimonials)).toBe(true);
    expect(testimonials.length).toBeGreaterThanOrEqual(1);
  });

  it("each entry has the required string fields", async () => {
    const { testimonials } = await import("./testimonials.ts");
    for (const t of testimonials) {
      expect(typeof t.name).toBe("string");
      expect(t.name.length).toBeGreaterThan(0);
      expect(typeof t.summary).toBe("string");
      expect(t.summary.length).toBeGreaterThan(0);
      expect(typeof t.fullText).toBe("string");
      expect(t.fullText.length).toBeGreaterThan(0);
    }
  });

  it("summary length is ≤ 140 chars for every entry", async () => {
    const { testimonials } = await import("./testimonials.ts");
    for (const t of testimonials) {
      expect(t.summary.length).toBeLessThanOrEqual(140);
    }
  });
});

// ── Test 2: Schema violation — missing field ──────────────────────────────────
describe("testimonials loader — schema violation: missing field", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when an entry is missing 'name'", async () => {
    vi.doMock("./testimonials.json", () => ({
      default: [
        { summary: "Good summary", fullText: "Full text here." }
      ],
    }));
    await expect(() => import("./testimonials.ts")).rejects.toThrow(
      /name is missing or not a string/
    );
  });

  it("throws when an entry is missing 'fullText'", async () => {
    vi.doMock("./testimonials.json", () => ({
      default: [
        { name: "Alice", summary: "Great care.", fullText: "" }
      ],
    }));
    await expect(() => import("./testimonials.ts")).rejects.toThrow(
      /fullText is missing or not a string/
    );
  });
});

// ── Test 3: Schema violation — summary too long ───────────────────────────────
describe("testimonials loader — schema violation: summary length", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when summary exceeds 140 characters", async () => {
    const longSummary = "A".repeat(141);
    vi.doMock("./testimonials.json", () => ({
      default: [
        { name: "Bob", summary: longSummary, fullText: "Full text." }
      ],
    }));
    await expect(() => import("./testimonials.ts")).rejects.toThrow(
      /summary exceeds 140 chars/
    );
  });

  it("accepts summary exactly 140 characters", async () => {
    const maxSummary = "A".repeat(140);
    vi.doMock("./testimonials.json", () => ({
      default: [
        { name: "Carol", summary: maxSummary, fullText: "Full text." }
      ],
    }));
    const { testimonials } = await import("./testimonials.ts");
    expect(testimonials[0]?.summary.length).toBe(140);
  });
});
