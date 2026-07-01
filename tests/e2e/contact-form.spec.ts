import { test, expect } from "@playwright/test";

/**
 * contact-form.spec.ts — M06 scenarios: Contact form (3 paths)
 *
 * Covers:
 * 1. Form-submission happy path against Resend sandbox (M06 AC-3)
 *    — requires RESEND_API_KEY set in .env.local; skipped otherwise.
 * 2. Validation-error UX path: empty Name → required error (M05 AC-1)
 * 3. Service-error UX path: mocked 4xx from /api/contact (M06 AC-3 error branch)
 *
 * M06 note: happy-path test is conditional on RESEND_API_KEY to let the
 * skeleton run without credentials while still covering the path fully
 * when credentials are present (qa-engineer wires this at stage 5).
 */

test.describe("Contact form — validation error", () => {
  test("empty Name field shows required error after submit attempt", async ({
    page,
  }) => {
    await page.goto("/en/contact/");

    // Leave Name empty; fill other required fields
    await page.fill("#contact-email", "test@example.com");
    await page.fill("#contact-message", "Hello from Playwright");

    // Submit triggers client-side validation
    await page.click('button[type="submit"]');

    // Required error should appear for Name field
    const nameError = page.locator("#name-error");
    await expect(nameError).toBeVisible();
    await expect(nameError).not.toBeEmpty();

    // Submit button should NOT be disabled (validation prevented submission)
    // The disable-on-click pattern only fires after passing validation
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).not.toBeDisabled();
  });

  test("empty Email field shows required error", async ({ page }) => {
    await page.goto("/en/contact/");

    await page.fill("#contact-name", "Test User");
    // Leave email empty
    await page.fill("#contact-message", "Hello from Playwright");

    await page.click('button[type="submit"]');

    const emailError = page.locator("#email-error");
    await expect(emailError).toBeVisible();
    await expect(emailError).not.toBeEmpty();
  });

  test("invalid Email format shows format error", async ({ page }) => {
    await page.goto("/en/contact/");

    await page.fill("#contact-name", "Test User");
    await page.fill("#contact-email", "not-an-email");
    await page.fill("#contact-message", "Hello from Playwright");

    await page.click('button[type="submit"]');

    const emailError = page.locator("#email-error");
    await expect(emailError).toBeVisible();
  });
});

test.describe("Contact form — service error (mocked 4xx)", () => {
  test("shows inline error message and fallback CTAs when /api/contact returns 502", async ({
    page,
  }) => {
    // Intercept the POST to /api/contact and return a 502
    await page.route("**/api/contact", (route) => {
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          code: "EMAIL_SERVICE_ERROR",
          message: "Email service temporarily unavailable",
        }),
      });
    });

    await page.goto("/en/contact/");

    // Fill valid form data
    await page.fill("#contact-name", "Test User");
    await page.fill("#contact-email", "test@example.com");
    await page.fill("#contact-message", "Testing error path");

    await page.click('button[type="submit"]');

    // Error banner should appear with aria-live="assertive"
    const errorBanner = page.locator(".form-error-banner");
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });

    // Error container has the correct aria attributes (AC-5 failure branch)
    await expect(errorBanner).toHaveAttribute("aria-live", "assertive");
    await expect(errorBanner).toHaveAttribute("role", "alert");

    // Fallback CTAs: phone number and KakaoTalk should remain visible
    // (they are in the right sidebar, always present per §06 §4.9)
    // TB-002 fix: scope to .contact-sidebar — the footer also has
    // data-placeholder="phone-number" so the unscoped locator resolves to 2 elements.
    const contactSidebar = page.locator('.contact-sidebar [data-placeholder="phone-number"]');
    await expect(contactSidebar).toBeVisible();
  });
});

test.describe("Contact form — happy path (Resend sandbox)", () => {
  // Skip if RESEND_API_KEY is not configured in the test environment.
  // qa-engineer should configure .env.local with a valid test key for stage-5 runs.
  test.skip(
    !process.env.RESEND_API_KEY,
    "RESEND_API_KEY not set — configure .env.local with Resend sandbox key to run E2E submission"
  );

  test("submits successfully and shows inline confirmation (AC-3)", async ({
    page,
  }) => {
    await page.goto("/en/contact/");

    // Fill all required fields
    await page.fill("#contact-name", "E2E Test User");
    await page.fill("#contact-email", "playwright-test@example.com");
    await page.fill("#contact-message", "Playwright E2E submission test — please ignore.");

    // Click submit
    await page.click('button[type="submit"]');

    // Button should disable immediately after click (submit-disable pattern)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Success container should appear with aria-live="polite"
    const successDiv = page.locator(".form-success");
    await expect(successDiv).toBeVisible({ timeout: 15_000 });
    await expect(successDiv).toHaveAttribute("aria-live", "polite");

    // Success message text should be visible
    const successMsg = page.locator(".form-success-message");
    await expect(successMsg).toBeVisible();
    await expect(successMsg).not.toBeEmpty();

    // "Send another message" reset link should appear
    const resetBtn = page.locator(".form-success-reset");
    await expect(resetBtn).toBeVisible();
  });

  test("KO locale: submits successfully with Korean strings", async ({
    page,
  }) => {
    await page.goto("/ko/contact/");

    await page.fill("#contact-name", "테스트 사용자");
    await page.fill("#contact-email", "test-ko@example.com");
    await page.fill("#contact-message", "플레이라이트 한국어 테스트입니다.");

    await page.click('button[type="submit"]');

    const successDiv = page.locator(".form-success");
    await expect(successDiv).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Contact form — submit button disable-on-click", () => {
  test("button disables immediately on valid submission attempt", async ({
    page,
  }) => {
    // Mock to slow response so we can observe the disabled state
    await page.route("**/api/contact", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, message: "Message sent" }),
      });
    });

    await page.goto("/en/contact/");

    await page.fill("#contact-name", "Test User");
    await page.fill("#contact-email", "test@example.com");
    await page.fill("#contact-message", "Disable test");

    await page.click('button[type="submit"]');

    // Button should be disabled while the request is in flight
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });
});
