import { type Page, expect } from "@playwright/test";

/**
 * Reusable login helper for E2E tests.
 *
 * Navigates to /login, fills in the credentials, submits the form,
 * and waits until the app redirects to /dashboard or /onboarding.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");

  // Wait for the login form to be ready
  await page.waitForSelector('input[id="email"]', { state: "visible" });

  // Fill credentials
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation away from the login page — the app redirects
  // to /dashboard (if onboarding is complete) or /onboarding (if not).
  await page.waitForURL(
    (url) => {
      const path = url.pathname;
      return path.startsWith("/dashboard") || path.startsWith("/onboarding");
    },
    { timeout: 15_000 },
  );
}

/** Default test credentials */
export const TEST_USER = {
  email: "edzonperez.castillo@gmail.com",
  password: "Edzondev2000!",
} as const;
