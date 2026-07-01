/**
 * src/content/clinical-cases.test.ts — unit tests for the clinical-cases loader (§05 §8.3 pattern)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Test 1: Demo JSON loads without throwing ──────────────────────────────────
describe("clinical-cases loader — happy path", () => {
  it("loads the 7 clinical cases from clinical-cases.json without throwing", async () => {
    const { clinicalCases } = await import("./clinical-cases.ts");
    expect(Array.isArray(clinicalCases)).toBe(true);
    expect(clinicalCases.length).toBe(7);
  });

  it("each entry has the required string fields", async () => {
    const { clinicalCases } = await import("./clinical-cases.ts");
    for (const c of clinicalCases) {
      expect(typeof c.id).toBe("string");
      expect(c.id.length).toBeGreaterThan(0);
      expect(typeof c.titleEn).toBe("string");
      expect(c.titleEn.length).toBeGreaterThan(0);
      expect(typeof c.summaryEn).toBe("string");
      expect(c.summaryEn.length).toBeGreaterThan(0);
      expect(typeof c.titleKo).toBe("string");
      expect(c.titleKo.length).toBeGreaterThan(0);
      expect(typeof c.summaryKo).toBe("string");
      expect(c.summaryKo.length).toBeGreaterThan(0);
    }
  });

  it("Korean summaries contain the F-09 placeholder pattern", async () => {
    const { clinicalCases } = await import("./clinical-cases.ts");
    for (const c of clinicalCases) {
      // Per F-09 / M02 AC, Korean summaries use "임상 사례 (한국어 번역 준비 중)" pattern
      expect(c.summaryKo).toContain("임상 사례");
    }
  });
});

// ── Test 2: Schema violation — missing field ──────────────────────────────────
describe("clinical-cases loader — schema violation: missing field", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when an entry is missing 'titleEn'", async () => {
    vi.doMock("./clinical-cases.json", () => ({
      default: [
        {
          id: "test",
          summaryEn: "A summary.",
          titleKo: "제목",
          summaryKo: "임상 사례 (한국어 번역 준비 중)"
        }
      ],
    }));
    await expect(() => import("./clinical-cases.ts")).rejects.toThrow(
      /titleEn is missing or not a non-empty string/
    );
  });

  it("throws when an entry is missing 'id'", async () => {
    vi.doMock("./clinical-cases.json", () => ({
      default: [
        {
          titleEn: "Title",
          summaryEn: "A summary.",
          titleKo: "제목",
          summaryKo: "임상 사례 (한국어 번역 준비 중)"
        }
      ],
    }));
    await expect(() => import("./clinical-cases.ts")).rejects.toThrow(
      /id is missing or not a non-empty string/
    );
  });

  it("throws when data is not an array", async () => {
    vi.doMock("./clinical-cases.json", () => ({
      default: { not: "an array" },
    }));
    await expect(() => import("./clinical-cases.ts")).rejects.toThrow(
      /must be a JSON array/
    );
  });
});
