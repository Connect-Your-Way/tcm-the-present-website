/**
 * src/content/treatment-areas.ts — build-time treatment-areas loader (§05 §9)
 *
 * Public interface:
 *   TreatmentArea — type for a single specialty entry
 *   treatmentAreas — readonly array of 7 TreatmentArea objects
 *
 * Source: 진료과목_260626_132258.docx — 7 specialties, bilingual EN/KO.
 *
 * Validates schema at module load; throws on violation (fail-loud — a bad
 * treatment-areas.json is caught at build time, not in production).
 * Used by the Clinic Introduction page (§06 02-clinic.md, M03).
 */

import rawData from "./treatment-areas.json";

export type TreatmentArea = {
  id: string;            // stable slug e.g. "womens-health"
  labelEn: string;
  labelKo: string;
  descriptionEn: string;
  descriptionKo: string;
};

/** Validate a single treatment-area entry. Throws on schema violation. */
function validateTreatmentArea(entry: unknown, index: number): TreatmentArea {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new Error(`[treatment-areas] entry[${index}] is not an object`);
  }

  const e = entry as Record<string, unknown>;
  const requiredStrings: (keyof TreatmentArea)[] = [
    "id",
    "labelEn",
    "labelKo",
    "descriptionEn",
    "descriptionKo",
  ];

  for (const key of requiredStrings) {
    if (typeof e[key] !== "string" || (e[key] as string).trim().length === 0) {
      throw new Error(
        `[treatment-areas] entry[${index}].${key} is missing or not a non-empty string`
      );
    }
  }

  return {
    id:            (e["id"] as string).trim(),
    labelEn:       (e["labelEn"] as string).trim(),
    labelKo:       (e["labelKo"] as string).trim(),
    descriptionEn: (e["descriptionEn"] as string).trim(),
    descriptionKo: (e["descriptionKo"] as string).trim(),
  };
}

/** Load and validate the treatment-areas array. */
function loadTreatmentAreas(): ReadonlyArray<TreatmentArea> {
  if (!Array.isArray(rawData)) {
    throw new Error("[treatment-areas] treatment-areas.json must be a JSON array");
  }
  if (rawData.length === 0) {
    throw new Error("[treatment-areas] treatment-areas.json must not be empty");
  }
  return rawData.map((entry, index) => validateTreatmentArea(entry, index));
}

export const treatmentAreas: ReadonlyArray<TreatmentArea> = loadTreatmentAreas();
