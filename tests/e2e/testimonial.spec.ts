import { test, expect } from "@playwright/test";

/**
 * testimonial.spec.ts — M06 scenario: testimonial accordion keyboard + a11y
 *
 * Covers the disclosure pattern on the Home page testimonials section:
 * - Tab → Enter to expand (M06 AC-4)
 * - Space to expand (keyboard alternative)
 * - Escape to collapse when expanded (M06 AC-4)
 * - aria-expanded toggles correctly (M06 AC-4)
 * - Screen-reader smoke: aria-controls + aria-labelledby wired (Flow 6 §07)
 */

test.describe("Testimonial accordion — keyboard interaction (AC-4)", () => {
  test("Enter key expands the first testimonial card", async ({ page }) => {
    await page.goto("/en/");

    // Find the first testimonial trigger button
    const firstTrigger = page.locator(".testimonial-trigger").first();
    await expect(firstTrigger).toBeVisible();

    // aria-expanded should start as false
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");

    // Tab to the trigger and press Enter
    await firstTrigger.focus();
    await page.keyboard.press("Enter");

    // aria-expanded should now be true
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    // The full text region should be visible
    const fullId = await firstTrigger.getAttribute("aria-controls");
    expect(fullId).toBeTruthy();
    const fullRegion = page.locator(`#${fullId}`);
    await expect(fullRegion).toBeVisible();
    await expect(fullRegion).not.toHaveAttribute("hidden");
  });

  test("Space key expands the second testimonial card", async ({ page }) => {
    await page.goto("/en/");

    const trigger = page.locator(".testimonial-trigger").nth(1);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.focus();
    await page.keyboard.press("Space");

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("Escape key collapses an expanded testimonial card", async ({ page }) => {
    await page.goto("/en/");

    const firstTrigger = page.locator(".testimonial-trigger").first();
    await expect(firstTrigger).toBeVisible();

    // Expand first
    await firstTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    // Collapse with Escape
    await page.keyboard.press("Escape");
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");

    // The full text region should be hidden again
    const fullId = await firstTrigger.getAttribute("aria-controls");
    const fullRegion = page.locator(`#${fullId}`);
    await expect(fullRegion).toHaveAttribute("hidden", "");

    // Focus should return to the trigger (§07 Flow 6 — focus management)
    await expect(firstTrigger).toBeFocused();
  });

  test("Click toggle: expand then collapse", async ({ page }) => {
    await page.goto("/en/");

    const trigger = page.locator(".testimonial-trigger").first();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Expand via click
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Collapse via click
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("Close button collapses expanded card and returns focus to trigger", async ({
    page,
  }) => {
    await page.goto("/en/");

    const trigger = page.locator(".testimonial-trigger").first();
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Click the "Close" button inside the expanded region
    const closeBtn = page
      .locator(".testimonial-close")
      .first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Focus returns to trigger
    await expect(trigger).toBeFocused();
  });
});

test.describe("Testimonial accordion — ARIA wiring (AC-4 screen-reader smoke)", () => {
  test("trigger aria-controls references existing region element", async ({
    page,
  }) => {
    await page.goto("/en/");

    const triggers = page.locator(".testimonial-trigger");
    const count = await triggers.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Every trigger must have aria-controls pointing to an existing element
    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      const controlsId = await trigger.getAttribute("aria-controls");
      expect(controlsId, `trigger[${i}] missing aria-controls`).toBeTruthy();

      const region = page.locator(`#${controlsId}`);
      await expect(
        region,
        `aria-controls=${controlsId} points to non-existent element`
      ).toHaveCount(1);

      // Region must have aria-labelledby back to the trigger
      const labelledBy = await region.getAttribute("aria-labelledby");
      const triggerId = await trigger.getAttribute("id");
      expect(labelledBy, `region[${i}] aria-labelledby mismatch`).toBe(triggerId);
    }
  });

  test("KO locale: testimonial accordion works identically", async ({
    page,
  }) => {
    await page.goto("/ko/");

    const firstTrigger = page.locator(".testimonial-trigger").first();
    await expect(firstTrigger).toBeVisible();

    await firstTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  });
});
