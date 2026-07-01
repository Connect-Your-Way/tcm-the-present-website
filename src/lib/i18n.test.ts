/**
 * src/lib/i18n.test.ts — unit tests for i18n.ts (§05 §7.3)
 * Tests: loadLocaleBundle, getString, assertParity.
 */

import { describe, it, expect } from "vitest";
import { loadLocaleBundle, getString, assertParity } from "./i18n.ts";

describe("loadLocaleBundle", () => {
  it("returns the EN bundle", () => {
    const bundle = loadLocaleBundle("en");
    expect(bundle).toBeDefined();
    expect(typeof bundle.common).toBe("object");
    expect(typeof bundle.placeholder).toBe("object");
  });

  it("returns the KO bundle", () => {
    const bundle = loadLocaleBundle("ko");
    expect(bundle).toBeDefined();
    expect(typeof bundle.common).toBe("object");
  });

  it("returns the same object on repeated calls (cache)", () => {
    const a = loadLocaleBundle("en");
    const b = loadLocaleBundle("en");
    expect(a).toBe(b);
  });
});

describe("getString", () => {
  it("navigates a dotted key path", () => {
    const bundle = loadLocaleBundle("en");
    const result = getString(bundle, "common.nav.clinic");
    expect(result).toBe("Clinic");
  });

  it("returns Korean text from KO bundle", () => {
    const bundle = loadLocaleBundle("ko");
    const result = getString(bundle, "common.nav.clinic");
    expect(result).toBe("진료 소개");
  });

  it("throws on a missing key", () => {
    const bundle = loadLocaleBundle("en");
    expect(() => getString(bundle, "common.nav.nonexistent")).toThrow(/Missing key/);
  });

  it("throws on a key that resolves to a non-string (object)", () => {
    const bundle = loadLocaleBundle("en");
    // "common.nav" is an object, not a string
    expect(() => getString(bundle, "common.nav")).toThrow(/non-string/);
  });

  it("returns page title from home namespace", () => {
    const bundle = loadLocaleBundle("en");
    const title = getString(bundle, "home.page.title");
    expect(title).toBe("Home");
  });
});

describe("assertParity", () => {
  it("passes when EN and KO bundles have identical key structures", () => {
    expect(() => assertParity()).not.toThrow();
  });
});
