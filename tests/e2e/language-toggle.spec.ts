import { test, expect } from "@playwright/test";

/**
 * language-toggle.spec.ts — M06 scenario: language toggle round-trip
 *
 * Asserts the EN/KO toggle navigates between equivalent pages
 * while preserving the current page slug (Flows 2–3 in §07).
 * Tested across all 4 page pairs (M06 AC-2).
 */

interface PagePair {
  label: string;
  en: string;
  ko: string;
}

const PAGE_PAIRS: PagePair[] = [
  { label: "Home", en: "/en/", ko: "/ko/" },
  { label: "Clinic", en: "/en/clinic/", ko: "/ko/clinic/" },
  { label: "About", en: "/en/about/", ko: "/ko/about/" },
  { label: "Contact", en: "/en/contact/", ko: "/ko/contact/" },
];

for (const pair of PAGE_PAIRS) {
  test(`lang-toggle: ${pair.label} — EN → KO preserves slug`, async ({
    page,
  }) => {
    await page.goto(pair.en);
    await expect(page).toHaveURL(pair.en);

    // TB-001 fix: scope to header to avoid strict-mode failure when footer also
    // renders a Korean-toggle link. Header toggle is always visible (no hamburger
    // at desktop viewport used in CI).
    // B-12 fix: aria-label is now "한국어로 전환" (WCAG 2.1 G149 — label in target language).
    const koLink = page.locator("header").getByRole("link", { name: /한국어로 전환/i });
    await expect(koLink).toBeVisible();
    await koLink.click();
    await expect(page).toHaveURL(pair.ko);

    // On the KO page the html[lang] should be "ko"
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("ko");
  });

  test(`lang-toggle: ${pair.label} — KO → EN preserves slug`, async ({
    page,
  }) => {
    await page.goto(pair.ko);
    await expect(page).toHaveURL(pair.ko);

    // TB-001 fix: scope to header (see above).
    const enLink = page.locator("header").getByRole("link", { name: /switch to english/i });
    await expect(enLink).toBeVisible();
    await enLink.click();
    await expect(page).toHaveURL(pair.en);

    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en");
  });
}

test("lang-toggle: round-trip on Home preserves page without 404", async ({
  page,
}) => {
  // Full round-trip: EN → KO → EN. Page should return 200 both ways.
  // TB-001 fix: scope to header toggle (see loop tests above).
  await page.goto("/en/");

  // B-12 fix: aria-label is now "한국어로 전환" (WCAG 2.1 G149).
  await page.locator("header").getByRole("link", { name: /한국어로 전환/i }).click();
  await expect(page).toHaveURL("/ko/");
  await expect(page).toHaveTitle(/TCM Clinic The Present/i);

  await page.locator("header").getByRole("link", { name: /switch to english/i }).click();
  await expect(page).toHaveURL("/en/");
  await expect(page).toHaveTitle(/TCM Clinic The Present/i);
});

// TC-005 — Footer language toggle preserves current path (F-01 AC-5, B-05/B-06 fix)
// Before the B-05+B-06 fix, footer LanguageToggle hardcoded currentPath="/" so it always
// navigated to the locale root regardless of the current page. This test verifies the fix.
test("lang-toggle: footer toggle preserves slug on non-home page (TC-005 / B-05)", async ({
  page,
}) => {
  // Navigate to a non-home page so the slug mismatch would be obvious
  await page.goto("/en/clinic/");
  await expect(page).toHaveURL("/en/clinic/");

  // Footer KO toggle — before B-05 fix: would navigate to /ko/ (wrong).
  // After fix: must navigate to /ko/clinic/ (correct).
  // B-12 fix: aria-label is now "한국어로 전환" (WCAG 2.1 G149 — label in target language).
  const footerKoLink = page
    .locator(".site-footer")
    .getByRole("link", { name: /한국어로 전환/i });
  await expect(footerKoLink).toBeVisible();
  await footerKoLink.click();
  await expect(page).toHaveURL("/ko/clinic/");
});
