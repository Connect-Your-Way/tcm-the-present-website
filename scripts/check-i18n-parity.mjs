#!/usr/bin/env node
/**
 * scripts/check-i18n-parity.mjs — prebuild i18n key-parity check (MILESTONES M01 AC §8)
 *
 * Reads EN and KO namespace JSON files directly via readFileSync.
 * Runs pre-Vite (as `prebuild`) so it cannot depend on static-import bundling;
 * i18n.ts uses static imports for the Vite/Astro context — this script is the
 * standalone Node CLI equivalent.
 *
 * Run with: node scripts/check-i18n-parity.mjs
 * Wired as `prebuild` in package.json so `pnpm build` fails before Astro compiles.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const I18N_DIR = join(ROOT, "src", "i18n");
const NAMESPACES = ["common", "placeholder", "images", "home", "clinic", "about", "contact"];

/** Read and parse a namespace JSON file. */
function readNs(locale, ns) {
  const raw = readFileSync(join(I18N_DIR, locale, `${ns}.json`), "utf-8");
  return JSON.parse(raw);
}

/** Recursively collect all dotted leaf-key paths from a nested object. */
function flattenKeys(obj, prefix = "") {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      for (const nested of flattenKeys(v, fullKey)) {
        keys.add(nested);
      }
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

/** Build a flat merged bundle object for a locale. */
function buildBundle(locale) {
  const bundle = {};
  for (const ns of NAMESPACES) {
    bundle[ns] = readNs(locale, ns);
  }
  return bundle;
}

const en = buildBundle("en");
const ko = buildBundle("ko");

const enKeys = flattenKeys(en);
const koKeys = flattenKeys(ko);

const onlyInEn = [...enKeys].filter((k) => !koKeys.has(k));
const onlyInKo = [...koKeys].filter((k) => !enKeys.has(k));

if (onlyInEn.length > 0 || onlyInKo.length > 0) {
  console.error("[i18n] parity check FAILED:");
  if (onlyInEn.length > 0) {
    console.error(`  Keys in EN only (${onlyInEn.length}): ${onlyInEn.join(", ")}`);
  }
  if (onlyInKo.length > 0) {
    console.error(`  Keys in KO only (${onlyInKo.length}): ${onlyInKo.join(", ")}`);
  }
  process.exit(1);
}

console.log("[i18n] EN ↔ KO key parity OK ✓");
