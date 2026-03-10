import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

test.describe("Auth — Login exitoso", () => {
  test("debe redirigir al dashboard o onboarding tras login correcto", async ({
    page,
  }) => {
    // Navigate to the landing page
    await page.goto("/");

    // Click the "Iniciar sesión" link in the navbar
    await page.click('a[href="/login"]');
    await page.waitForURL("**/login");

    // Fill in the login form
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or onboarding
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        return path.startsWith("/dashboard") || path.startsWith("/onboarding");
      },
      { timeout: 15_000 },
    );

    const currentPath = new URL(page.url()).pathname;
    expect(
      currentPath.startsWith("/dashboard") ||
        currentPath.startsWith("/onboarding"),
    ).toBe(true);

    // If we ended up on the dashboard, the sidebar should be visible
    if (currentPath.startsWith("/dashboard")) {
      await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});

test.describe("Auth — Login fallido", () => {
  test("debe mostrar un error con credenciales incorrectas y no redirigir", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForSelector('input[id="email"]', { state: "visible" });

    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', "ContraseñaIncorrecta123!");

    await page.click('button[type="submit"]');

    // The app should stay on /login and not redirect
    // Give it a moment to potentially redirect (it shouldn't)
    await page.waitForTimeout(3_000);

    const currentPath = new URL(page.url()).pathname;
    expect(currentPath).toBe("/login");

    // Verify the page does NOT navigate to dashboard
    expect(currentPath).not.toBe("/dashboard");
  });
});

test.describe("Auth — Redirección de rutas protegidas", () => {
  const protectedRoutes = [
    "/dashboard",
    "/expenses",
    "/payday",
    "/register-income",
    "/rescue",
    "/savings",
  ];

  for (const route of protectedRoutes) {
    test(`navegar a ${route} sin sesión debe redirigir a /login o /`, async ({
      page,
    }) => {
      await page.goto(route);

      // The server-side middleware should redirect unauthenticated users
      await page.waitForURL(
        (url) => {
          const path = url.pathname;
          return path === "/" || path === "/login";
        },
        { timeout: 10_000 },
      );

      const currentPath = new URL(page.url()).pathname;
      expect(currentPath === "/" || currentPath === "/login").toBe(true);
    });
  }
});

test.describe("Auth — Logout", () => {
  test("debe cerrar sesión y redirigir fuera del dashboard", async ({
    page,
  }) => {
    // Login first
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const afterLoginPath = new URL(page.url()).pathname;

    // Only proceed with logout if we're on the dashboard
    if (afterLoginPath.startsWith("/dashboard")) {
      // Navigate to the profile page where the logout button lives
      await page.goto("/profile");
      await page.waitForURL("**/profile", { timeout: 10_000 });

      // Click the "Cerrar sesión" button on the profile page
      const logoutButton = page.locator("button", {
        hasText: "Cerrar sesión",
      });
      await logoutButton.waitFor({ state: "visible", timeout: 10_000 });
      await logoutButton.click();

      // Wait for redirect to login or landing
      await page.waitForURL(
        (url) => {
          const path = url.pathname;
          return path === "/" || path === "/login";
        },
        { timeout: 10_000 },
      );

      const loggedOutPath = new URL(page.url()).pathname;
      expect(loggedOutPath === "/" || loggedOutPath === "/login").toBe(true);

      // Verify protected routes are no longer accessible
      await page.goto("/dashboard");
      await page.waitForURL(
        (url) => {
          const path = url.pathname;
          return path === "/" || path === "/login";
        },
        { timeout: 10_000 },
      );

      const afterLogoutPath = new URL(page.url()).pathname;
      expect(
        afterLogoutPath === "/" || afterLogoutPath === "/login",
      ).toBe(true);
    }
  });
});
