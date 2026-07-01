import { test, expect } from "@playwright/test";

/**
 * mobile.spec.ts — M06 scenario: mobile viewport checks (AC-5)
 *
 * Asserts:
 * - No horizontal scroll at 390 px (iPhone 14 width) across all 8 routes
 * - No horizontal scroll at 768 px (iPad portrait) across all 8 routes
 * - Tap targets ≥ 44 × 44 px (spot-check key interactive elements)
 *
 * These tests run with a mobile viewport override so they exercise the
 * responsive layout regardless of the browser project's default viewport.
 * qa-engineer can expand the tap-target list at stage 5.
 */

const ROUTES = [
  { url: "/en/", label: "EN Home" },
  { url: "/ko/", label: "KO Home" },
  { url: "/en/clinic/", label: "EN Clinic" },
  { url: "/ko/clinic/", label: "KO Clinic" },
  { url: "/en/about/", label: "EN About" },
  { url: "/ko/about/", label: "KO About" },
  { url: "/en/contact/", label: "EN Contact" },
  { url: "/ko/contact/", label: "KO Contact" },
];

const VIEWPORTS = [
  { width: 390, height: 844, label: "390 px (iPhone 14)" },
  { width: 768, height: 1024, label: "768 px (iPad portrait)" },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Mobile viewport — ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`no horizontal scroll: ${route.label}`, async ({ page }) => {
        await page.goto(route.url);

        // Check for horizontal overflow (AC-5)
        const hasHorizontalScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });

        expect(
          hasHorizontalScroll,
          `Horizontal scroll detected at ${viewport.width}px on ${route.url}`
        ).toBe(false);
      });
    }
  });
}

test.describe("Tap targets ≥ 44 × 44 px (AC-5, F-08)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("navigation links meet 44 px minimum", async ({ page }) => {
    await page.goto("/en/");

    // Check header nav links
    const navLinks = page.locator("nav a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      if (!box) continue; // hidden element

      expect(
        box.width,
        `Nav link[${i}] width ${box.width}px < 44px`
      ).toBeGreaterThanOrEqual(44);
      expect(
        box.height,
        `Nav link[${i}] height ${box.height}px < 44px`
      ).toBeGreaterThanOrEqual(44);
    }
  });

  test("language toggle buttons meet 44 px minimum", async ({ page }) => {
    await page.goto("/en/");

    // The language toggle renders as a <div> with .lang-btn items
    // Active locale = span, inactive = <a>
    // TB-003 fix: scope to .footer-lang-toggle — at 390 px mobile the header
    // language toggle is inside the closed hamburger drawer and its boundingBox()
    // returns null. The footer toggle is always visible at mobile viewport.
    const koLink = page.locator('.footer-lang-toggle a.lang-btn');
    const count = await koLink.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const box = await koLink.first().boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("Contact submit button meets 44 px minimum", async ({ page }) => {
    await page.goto("/en/contact/");

    const submitBtn = page.locator('button[type="submit"]');
    const box = await submitBtn.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("Testimonial close button meets 44 px minimum", async ({ page }) => {
    await page.goto("/en/");

    // Expand the first accordion to reveal the close button
    const trigger = page.locator(".testimonial-trigger").first();
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const closeBtn = page.locator(".testimonial-close").first();
    await expect(closeBtn).toBeVisible();
    const box = await closeBtn.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
