/**
 * src/content/clinical-cases.ts — build-time clinical cases loader (S4-PLAN M02)
 *
 * Public interface:
 *   clinicalCases — readonly array of ClinicalCase objects
 *
 * Validates schema at module load; throws on violation (fail-loud — a bad
 * clinical-cases.json is caught at build time, not in production).
 *
 * Korean side: summaryKo uses the F-09 placeholder pattern per M02 AC.
 * The Home page CaseCard renders this as a styled inline label on /ko/ locale.
 */

import rawData from "./clinical-cases.json";

export type ClinicalCase = {
  id: string;
  titleEn: string;
  summaryEn: string;
  titleKo: string;
  summaryKo: string;
};

/** Validate a single case entry. Throws on schema violation. */
function validateCase(entry: unknown, index: number): ClinicalCase {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new Error(`[clinical-cases] entry[${index}] is not an object`);
  }

  const e = entry as Record<string, unknown>;
  const requiredStrings: (keyof ClinicalCase)[] = [
    "id",
    "titleEn",
    "summaryEn",
    "titleKo",
    "summaryKo",
  ];

  for (const key of requiredStrings) {
    if (typeof e[key] !== "string" || (e[key] as string).length === 0) {
      throw new Error(
        `[clinical-cases] entry[${index}].${key} is missing or not a non-empty string`
      );
    }
  }

  return {
    id:         e["id"] as string,
    titleEn:    e["titleEn"] as string,
    summaryEn:  e["summaryEn"] as string,
    titleKo:    e["titleKo"] as string,
    summaryKo:  e["summaryKo"] as string,
  };
}

/** Load and validate the clinical cases array. */
function loadClinicalCases(): ReadonlyArray<ClinicalCase> {
  if (!Array.isArray(rawData)) {
    throw new Error("[clinical-cases] clinical-cases.json must be a JSON array");
  }
  return rawData.map((entry, index) => validateCase(entry, index));
}

export const clinicalCases: ReadonlyArray<ClinicalCase> = loadClinicalCases();
