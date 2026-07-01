/**
 * src/lib/i18n.ts — locale bundle loader + parity assertion (§05 §7)
 *
 * Public interface:
 *   loadLocaleBundle(locale) — returns merged bundle for a locale
 *   getString(bundle, dottedKey) — navigates dotted path; throws on missing key
 *   assertParity() — throws if EN and KO bundles have mismatched keys
 *
 * Uses static JSON imports so Vite/Rollup bundles the data inline. This is
 * required for Astro's prerender pipeline — after bundling, import.meta.url
 * points to the dist/ chunk, not the src/ tree, so readFileSync with relative
 * paths would fail. Static imports are bundled at build time; no fs I/O.
 *
 * The parity script (scripts/check-i18n-parity.mjs) has its own readFileSync
 * implementation — it runs pre-Vite via node --experimental-strip-types.
 */

// ── EN namespaces ─────────────────────────────────────────────────────────────
import enCommon from "../i18n/en/common.json";
import enPlaceholder from "../i18n/en/placeholder.json";
import enImages from "../i18n/en/images.json";
import enHome from "../i18n/en/home.json";
import enClinic from "../i18n/en/clinic.json";
import enAbout from "../i18n/en/about.json";
import enContact from "../i18n/en/contact.json";

// ── KO namespaces ─────────────────────────────────────────────────────────────
import koCommon from "../i18n/ko/common.json";
import koPlaceholder from "../i18n/ko/placeholder.json";
import koImages from "../i18n/ko/images.json";
import koHome from "../i18n/ko/home.json";
import koClinic from "../i18n/ko/clinic.json";
import koAbout from "../i18n/ko/about.json";
import koContact from "../i18n/ko/contact.json";

export type Locale = "en" | "ko";

/** Nested bundle structure matching the per-page namespace split */
export type LocaleBundle = {
  common: Record<string, unknown>;
  placeholder: Record<string, unknown>;
  images: Record<string, unknown>;
  home: Record<string, unknown>;
  clinic: Record<string, unknown>;
  about: Record<string, unknown>;
  contact: Record<string, unknown>;
};

// Pre-assembled singleton bundles — no runtime file I/O.
const EN_BUNDLE: LocaleBundle = {
  common:      enCommon as Record<string, unknown>,
  placeholder: enPlaceholder as Record<string, unknown>,
  images:      enImages as Record<string, unknown>,
  home:        enHome as Record<string, unknown>,
  clinic:      enClinic as Record<string, unknown>,
  about:       enAbout as Record<string, unknown>,
  contact:     enContact as Record<string, unknown>,
};

const KO_BUNDLE: LocaleBundle = {
  common:      koCommon as Record<string, unknown>,
  placeholder: koPlaceholder as Record<string, unknown>,
  images:      koImages as Record<string, unknown>,
  home:        koHome as Record<string, unknown>,
  clinic:      koClinic as Record<string, unknown>,
  about:       koAbout as Record<string, unknown>,
  contact:     koContact as Record<string, unknown>,
};

/** Return the merged bundle for a locale. O(1) — singleton references. */
export function loadLocaleBundle(locale: Locale): LocaleBundle {
  return locale === "en" ? EN_BUNDLE : KO_BUNDLE;
}

/**
 * Navigate a dotted key path through a bundle.
 * e.g. getString(bundle, "common.nav.clinic") → "Clinic"
 * Throws on missing key (fail-loud: a missing key is a content bug).
 */
export function getString(bundle: LocaleBundle, dottedKey: string): string {
  const parts = dottedKey.split(".");
  let node: unknown = bundle;
  for (const part of parts) {
    if (
      typeof node !== "object" ||
      node === null ||
      !(part in (node as Record<string, unknown>))
    ) {
      throw new Error(
        `[i18n] Missing key "${dottedKey}" — failed at segment "${part}". ` +
          `Add the key to both en/ and ko/ bundles.`
      );
    }
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== "string") {
    throw new Error(
      `[i18n] Key "${dottedKey}" resolves to a non-string value (${typeof node}). ` +
        `Keys must point to leaf strings.`
    );
  }
  return node;
}

/** Recursively flatten a nested object into dotted-key → value pairs. */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      for (const nested of flattenKeys(v as Record<string, unknown>, fullKey)) {
        keys.add(nested);
      }
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

/**
 * Assert that EN and KO bundles have identical key structures.
 * Throws with a descriptive message listing divergent keys.
 * Called by: Vitest unit test (src/lib/i18n.test.ts).
 * The prebuild parity script has its own readFileSync implementation.
 */
export function assertParity(): void {
  const enKeys = flattenKeys(EN_BUNDLE as unknown as Record<string, unknown>);
  const koKeys = flattenKeys(KO_BUNDLE as unknown as Record<string, unknown>);

  const onlyInEn = [...enKeys].filter((k) => !koKeys.has(k));
  const onlyInKo = [...koKeys].filter((k) => !enKeys.has(k));

  if (onlyInEn.length > 0 || onlyInKo.length > 0) {
    const lines: string[] = ["[i18n] EN ↔ KO key parity FAILED:"];
    if (onlyInEn.length > 0) {
      lines.push(`  Keys in EN only (${onlyInEn.length}): ${onlyInEn.join(", ")}`);
    }
    if (onlyInKo.length > 0) {
      lines.push(`  Keys in KO only (${onlyInKo.length}): ${onlyInKo.join(", ")}`);
    }
    throw new Error(lines.join("\n"));
  }
}
