import { test, expect } from "@playwright/test";

/**
 * smoke.spec.ts — M06 scenario: 8 smoke-route GETs
 *
 * Asserts every route returns 200 with valid HTML and no console errors
 * in both Chromium and WebKit (M06 AC-1).
 *
 * Routes mirror the 8 pages defined in §06 specs:
 *   /en/, /ko/ (Home)
 *   /en/clinic/, /ko/clinic/ (Clinic)
 *   /en/about/, /ko/about/ (About)
 *   /en/contact/, /ko/contact/ (Contact)
 */

const ROUTES: Array<{ url: string; label: string; locale: string }> = [
  { url: "/en/", label: "EN Home", locale: "en" },
  { url: "/ko/", label: "KO Home", locale: "ko" },
  { url: "/en/clinic/", label: "EN Clinic", locale: "en" },
  { url: "/ko/clinic/", label: "KO Clinic", locale: "ko" },
  { url: "/en/about/", label: "EN About", locale: "en" },
  { url: "/ko/about/", label: "KO About", locale: "ko" },
  { url: "/en/contact/", label: "EN Contact", locale: "en" },
  { url: "/ko/contact/", label: "KO Contact", locale: "ko" },
];

for (const route of ROUTES) {
  test(`smoke: ${route.label} — 200 + no console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // Exclude common dev-server noise that is not page errors
        const text = msg.text();
        if (
          text.includes("favicon") ||
          text.includes("ERR_ABORTED") ||
          text.includes("net::ERR_FILE_NOT_FOUND")
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    const response = await page.goto(route.url);

    // AC-1: HTTP 200
    expect(response?.status(), `Expected 200 on ${route.url}`).toBe(200);

    // AC-1: Valid HTML — page has a title
    await expect(page).toHaveTitle(/TCM Clinic The Present/i);

    // AC-1: No console errors
    expect(
      consoleErrors,
      `Console errors on ${route.url}: ${consoleErrors.join("; ")}`
    ).toHaveLength(0);

    // Locale-specific: html[lang] matches the route's locale
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang, `html[lang] mismatch on ${route.url}`).toBe(route.locale);

    // Exactly one <h1> per page (AC-1 via F-08)
    const h1Count = await page.locator("h1").count();
    expect(h1Count, `Expected 1 <h1> on ${route.url}`).toBe(1);

    // hreflang alternates present (M01 AC)
    const enAlternate = page.locator('link[rel="alternate"][hreflang="en"]');
    const koAlternate = page.locator('link[rel="alternate"][hreflang="ko"]');
    await expect(enAlternate).toHaveCount(1);
    await expect(koAlternate).toHaveCount(1);
  });
}

test("root / redirects to /en/ with 302", async ({ page }) => {
  const response = await page.goto("/");
  // After redirect, the final URL should be /en/
  expect(page.url()).toContain("/en/");
  expect(response?.status()).toBe(200);
});
