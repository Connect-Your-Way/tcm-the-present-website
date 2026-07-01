/**
 * src/content/treatment-areas.test.ts — unit tests for the treatment-areas loader (§05 §9)
 *
 * Pattern mirrors clinical-cases.test.ts (M02):
 *   - Happy path: loads the 7 entries; each has all required bilingual fields; IDs are unique.
 *   - Schema violations: missing field, empty field, non-array root.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Happy-path tests ──────────────────────────────────────────────────────────

describe("treatment-areas loader — happy path", () => {
  it("loads the 7 treatment areas from treatment-areas.json without throwing", async () => {
    const { treatmentAreas } = await import("./treatment-areas.ts");
    expect(Array.isArray(treatmentAreas)).toBe(true);
    expect(treatmentAreas.length).toBe(7);
  });

  it("each entry has the required bilingual string fields", async () => {
    const { treatmentAreas } = await import("./treatment-areas.ts");
    for (const area of treatmentAreas) {
      expect(typeof area.id).toBe("string");
      expect(area.id.trim().length).toBeGreaterThan(0);
      expect(typeof area.labelEn).toBe("string");
      expect(area.labelEn.trim().length).toBeGreaterThan(0);
      expect(typeof area.labelKo).toBe("string");
      expect(area.labelKo.trim().length).toBeGreaterThan(0);
      expect(typeof area.descriptionEn).toBe("string");
      expect(area.descriptionEn.trim().length).toBeGreaterThan(0);
      expect(typeof area.descriptionKo).toBe("string");
      expect(area.descriptionKo.trim().length).toBeGreaterThan(0);
    }
  });

  it("all IDs are unique slug strings", async () => {
    const { treatmentAreas } = await import("./treatment-areas.ts");
    const ids = treatmentAreas.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("Korean labels contain Korean characters", async () => {
    const { treatmentAreas } = await import("./treatment-areas.ts");
    for (const area of treatmentAreas) {
      // Korean characters are in the Hangul Unicode range U+AC00–U+D7A3
      expect(/[가-힣]/.test(area.labelKo)).toBe(true);
    }
  });
});

// ── Schema-violation tests ────────────────────────────────────────────────────

describe("treatment-areas loader — schema violations", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when an entry is missing 'labelEn'", async () => {
    vi.doMock("./treatment-areas.json", () => ({
      default: [
        {
          id: "test",
          labelKo: "테스트",
          descriptionEn: "Test description.",
          descriptionKo: "테스트 설명.",
        },
      ],
    }));
    await expect(() => import("./treatment-areas.ts")).rejects.toThrow(
      /labelEn is missing or not a non-empty string/
    );
  });

  it("throws when an entry has an empty 'labelKo'", async () => {
    vi.doMock("./treatment-areas.json", () => ({
      default: [
        {
          id: "test",
          labelEn: "Test",
          labelKo: "   ",
          descriptionEn: "Test description.",
          descriptionKo: "테스트 설명.",
        },
      ],
    }));
    await expect(() => import("./treatment-areas.ts")).rejects.toThrow(
      /labelKo is missing or not a non-empty string/
    );
  });

  it("throws when an entry is missing 'descriptionKo'", async () => {
    vi.doMock("./treatment-areas.json", () => ({
      default: [
        {
          id: "test",
          labelEn: "Test",
          labelKo: "테스트",
          descriptionEn: "Test description.",
        },
      ],
    }));
    await expect(() => import("./treatment-areas.ts")).rejects.toThrow(
      /descriptionKo is missing or not a non-empty string/
    );
  });

  it("throws when the root value is not an array", async () => {
    vi.doMock("./treatment-areas.json", () => ({
      default: { not: "an array" },
    }));
    await expect(() => import("./treatment-areas.ts")).rejects.toThrow(
      /must be a JSON array/
    );
  });

  it("throws when the array is empty", async () => {
    vi.doMock("./treatment-areas.json", () => ({
      default: [],
    }));
    await expect(() => import("./treatment-areas.ts")).rejects.toThrow(
      /must not be empty/
    );
  });
});
