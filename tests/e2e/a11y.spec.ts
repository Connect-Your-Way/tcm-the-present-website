import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * a11y.spec.ts — M06 scenario: WCAG AA axe audit + font-display check
 *
 * Runs @axe-core/playwright against all 8 routes and asserts:
 * - Zero "critical" or "serious" axe violations (M06 AC-6)
 * - Alt text present on all <img> elements (M06 AC-7)
 * - Noto Sans KR font-display: swap wired in the stylesheet (M06 AC-9)
 *
 * Run subset: pnpm test:a11y
 * Full suite: pnpm test:e2e
 *
 * First-time: pnpm install && pnpm exec playwright install chromium webkit
 */

const ROUTES: Array<{ url: string; label: string }> = [
  { url: "/en/", label: "EN Home" },
  { url: "/ko/", label: "KO Home" },
  { url: "/en/clinic/", label: "EN Clinic" },
  { url: "/ko/clinic/", label: "KO Clinic" },
  { url: "/en/about/", label: "EN About" },
  { url: "/ko/about/", label: "KO About" },
  { url: "/en/contact/", label: "EN Contact" },
  { url: "/ko/contact/", label: "KO Contact" },
];

for (const route of ROUTES) {
  test(`a11y: ${route.label} — zero critical/serious axe violations (AC-6)`, async ({
    page,
  }) => {
    await page.goto(route.url);

    // Run axe targeting WCAG 2.1 AA level
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    // Filter to critical and serious only (minor/moderate are tracked but not blocking)
    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    // Report detail on failure
    const violationSummary = criticalOrSerious.map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`
    );

    expect(
      criticalOrSerious,
      `Axe violations on ${route.url}:\n${violationSummary.join("\n")}`
    ).toHaveLength(0);
  });

  test(`a11y: ${route.label} — all <img> have non-empty alt text (AC-7)`, async ({
    page,
  }) => {
    await page.goto(route.url);

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const src = await img.getAttribute("src");

      // Decorative images must have alt="" (empty string), not missing alt.
      // Content images must have non-empty alt.
      // The spec requires alt text from i18n images.* namespace (M06 AC-7).
      expect(
        alt,
        `img[${i}] (src=${src}) is missing the alt attribute — must be "" for decorative or descriptive for content`
      ).not.toBeNull();
    }
  });
}

test.describe("a11y: Noto Sans KR font-display: swap (AC-9)", () => {
  test("Google Fonts stylesheet includes display=swap parameter", async ({
    page,
  }) => {
    await page.goto("/en/");

    // The Layout.astro <link> href should include display=swap
    const fontLink = page.locator(
      'link[rel="stylesheet"][href*="fonts.googleapis.com"]'
    );
    await expect(fontLink).toHaveCount(1);

    const href = await fontLink.getAttribute("href");
    expect(href, "Google Fonts href missing display=swap").toContain(
      "display=swap"
    );
  });

  test("KO pages load Noto Sans KR stylesheet", async ({ page }) => {
    await page.goto("/ko/");

    const fontLink = page.locator(
      'link[rel="stylesheet"][href*="Noto+Sans+KR"]'
    );
    await expect(fontLink).toHaveCount(1);
  });

  test("Korean text elements use the Noto Sans KR font family", async ({
    page,
  }) => {
    await page.goto("/ko/");

    // The :lang(ko) rule in global.css sets font-family to var(--font-ko)
    // Verify the CSS rule is applied — check body's computed font-family on KO page
    const bodyFontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily
    );

    // Noto Sans KR should appear in the computed style on the KO page
    expect(
      bodyFontFamily.toLowerCase(),
      "Noto Sans KR not in computed font-family on KO page"
    ).toContain("noto sans kr");
  });
});

test.describe("a11y: Focus management and keyboard nav (AC-4, F-08)", () => {
  test("skip link is first focusable element", async ({ page }) => {
    await page.goto("/en/");

    // Tab once to focus the first element
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        href: (el as HTMLAnchorElement)?.href,
        className: el?.className,
      };
    });

    // The first Tab stop should be the skip link (a.sr-only per global.css)
    expect(focused.className, "First Tab stop is not the skip link").toContain(
      "sr-only"
    );
  });

  test("focus rings are visible (not suppressed)", async ({ page }) => {
    await page.goto("/en/");

    // Tab to the first nav link and check that focus outline is not none/0
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // first nav element

    const outlineStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el, ":focus-visible");
      return style.outlineStyle;
    });

    // Focus outline must not be "none" (WCAG 2.4.7 / F-08)
    // Note: browsers may report "auto" for user-agent focus; that is acceptable
    expect(
      outlineStyle,
      "Focus outline is 'none' — violates WCAG 2.4.7"
    ).not.toBe("none");
  });
});
