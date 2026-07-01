/**
 * src/content/testimonials.ts — build-time testimonials loader (§05 §8)
 *
 * Public interface:
 *   testimonials — readonly array of Testimonial objects
 *
 * Validates schema at module load; throws on violation (fail-loud — a bad
 * testimonials.json is caught at build time, not in production).
 */

import rawData from "./testimonials.json";

export type Testimonial = {
  name: string;
  summary: string;     // ≤ 140 chars; card-default state
  fullText: string;    // multi-line accepted; card-expanded state
  placeholder?: boolean; // true → demo-badge rendered on the card
};

/** Validate a single testimonial entry shape. Throws on violation. */
function validateEntry(entry: unknown, index: number): Testimonial {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new Error(`[testimonials] entry[${index}] is not an object`);
  }

  const e = entry as Record<string, unknown>;

  if (typeof e["name"] !== "string" || e["name"].length === 0) {
    throw new Error(`[testimonials] entry[${index}].name is missing or not a string`);
  }
  if (typeof e["summary"] !== "string" || e["summary"].length === 0) {
    throw new Error(`[testimonials] entry[${index}].summary is missing or not a string`);
  }
  if (e["summary"].length > 140) {
    throw new Error(
      `[testimonials] entry[${index}].summary exceeds 140 chars (length: ${e["summary"].length})`
    );
  }
  if (typeof e["fullText"] !== "string" || e["fullText"].length === 0) {
    throw new Error(`[testimonials] entry[${index}].fullText is missing or not a string`);
  }

  return {
    name:        e["name"] as string,
    summary:     e["summary"] as string,
    fullText:    e["fullText"] as string,
    placeholder: typeof e["placeholder"] === "boolean" ? e["placeholder"] : undefined,
  };
}

/** Validates and exports the testimonials array from testimonials.json */
function loadTestimonials(): ReadonlyArray<Testimonial> {
  if (!Array.isArray(rawData)) {
    throw new Error("[testimonials] testimonials.json must be a JSON array");
  }
  return rawData.map((entry, index) => validateEntry(entry, index));
}

export const testimonials: ReadonlyArray<Testimonial> = loadTestimonials();
