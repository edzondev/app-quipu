import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

/**
 * PRECONDITION: For rescue-mode tests to fully exercise the flow, the test
 * user must be in a state where spending in at least one envelope (Necesidades
 * or Gustos) has exceeded the allocated budget for the current month.
 *
 * If the user is NOT in rescue mode, the rescue-specific steps will be
 * detected and the tests will skip gracefully.
 *
 * To set up this state you can either:
 *   1. Use a dedicated test user whose envelope is already in deficit.
 *   2. Manually register enough expenses via Convex to exceed the budget
 *      before running these tests.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Checks whether the rescue-mode banner is visible on the dashboard. */
async function isRescueBannerVisible(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  // The banner contains "Modo Rescate activado"
  return page
    .locator("text=Modo Rescate activado")
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
}

// ---------------------------------------------------------------------------
// Rescue — Banner on dashboard
// ---------------------------------------------------------------------------

test.describe("Rescue — Banner en el dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("si el usuario está en modo rescate, el banner debe ser visible con el mensaje correcto", async ({
    page,
  }) => {
    // Wait for the dashboard to fully render
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);

    if (!bannerVisible) {
      test.skip(
        true,
        "User is NOT in rescue mode — cannot verify banner. PRECONDITION: user must be over budget in at least one envelope.",
      );
      return;
    }

    // The banner should display "Modo Rescate activado"
    await expect(
      page.locator("text=Modo Rescate activado"),
    ).toBeVisible();

    // It should mention which envelope is over limit — either Necesidades or Gustos
    const bannerText = await page
      .locator("button")
      .filter({ hasText: "Modo Rescate activado" })
      .textContent();

    expect(bannerText).toBeTruthy();
    expect(
      bannerText!.includes("sobre el límite") ||
        bannerText!.includes("sobre tu límite"),
    ).toBe(true);
  });

  test("clic en el banner de rescate debe navegar a /rescue", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);

    if (!bannerVisible) {
      test.skip(true, "User is NOT in rescue mode — skipping navigation test");
      return;
    }

    // Click the rescue banner (it's a <button> wrapping the banner content)
    const rescueBanner = page
      .locator("button")
      .filter({ hasText: "Modo Rescate activado" });
    await rescueBanner.click();

    // Should navigate to /rescue
    await page.waitForURL("**/rescue", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/rescue");
  });
});

// ---------------------------------------------------------------------------
// Rescue — Select action step
// ---------------------------------------------------------------------------

test.describe("Rescue — Pantalla de selección de acción", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe mostrar el monto del déficit en color destructive y las dos opciones de acción", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);
    if (!bannerVisible) {
      test.skip(true, "User is NOT in rescue mode — skipping");
      return;
    }

    // Navigate to /rescue
    await page.goto("/rescue");
    await page.waitForURL("**/rescue", { timeout: 10_000 });

    // The headline should show "Estás {symbol} {deficit} sobre tu límite este mes."
    const headline = page.locator("h1").filter({ hasText: "sobre tu límite" });
    await expect(headline).toBeVisible({ timeout: 10_000 });

    // The deficit amount should be styled with text-destructive
    const destructiveSpan = headline.locator(".text-destructive");
    await expect(destructiveSpan).toBeVisible();
    const deficitText = await destructiveSpan.textContent();
    expect(deficitText).toBeTruthy();
    // Should contain the currency symbol
    expect(deficitText!).toMatch(/S\//);

    // The subtitle should mention the envelope name
    await expect(
      page.locator("text=/ha superado su presupuesto/"),
    ).toBeVisible();

    // ── Two action cards ──
    // Action 1: Transfer from savings (ArrowLeftRight icon)
    const transferCard = page
      .locator("button")
      .filter({ hasText: /Mover|transferir|desde Ahorro/i });

    // Action 2: Pause savings contribution (PauseCircle icon)
    const pauseCard = page
      .locator("button")
      .filter({ hasText: /Pausar|contribución/i });

    // At least one of the two should be visible
    const transferVisible = await transferCard
      .first()
      .isVisible()
      .catch(() => false);
    const pauseVisible = await pauseCard
      .first()
      .isVisible()
      .catch(() => false);

    expect(transferVisible || pauseVisible).toBe(true);
  });

  test("el botón 'Aplicar solución' debe estar deshabilitado sin seleccionar acción", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);
    if (!bannerVisible) {
      test.skip(true, "User is NOT in rescue mode — skipping");
      return;
    }

    await page.goto("/rescue");
    await page.waitForURL("**/rescue", { timeout: 10_000 });

    // Wait for the rescue view to load
    await expect(
      page.locator("h1").filter({ hasText: "sobre tu límite" }),
    ).toBeVisible({ timeout: 10_000 });

    // The "Aplicar solución" button should be disabled initially
    const applyButton = page.locator("button", {
      hasText: "Aplicar solución",
    });
    await expect(applyButton).toBeVisible();
    await expect(applyButton).toBeDisabled();
  });

  test("seleccionar una acción debe habilitar el botón 'Aplicar solución'", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);
    if (!bannerVisible) {
      test.skip(true, "User is NOT in rescue mode — skipping");
      return;
    }

    await page.goto("/rescue");
    await page.waitForURL("**/rescue", { timeout: 10_000 });

    await expect(
      page.locator("h1").filter({ hasText: "sobre tu límite" }),
    ).toBeVisible({ timeout: 10_000 });

    // Find the first non-disabled action card
    const actionCards = page
      .locator("button")
      .filter({ has: page.locator(".rounded-full.bg-destructive\\/10") });

    const actionCount = await actionCards.count();
    expect(actionCount).toBeGreaterThanOrEqual(1);

    // Try to find the first enabled card
    let clickedCard = false;
    for (let i = 0; i < actionCount; i++) {
      const card = actionCards.nth(i);
      const isDisabled = await card.isDisabled();
      if (!isDisabled) {
        await card.click();
        clickedCard = true;

        // Verify the card shows selected state (ring-2 ring-destructive/40)
        await expect(card).toHaveClass(/border-destructive/, {
          timeout: 3_000,
        });
        break;
      }
    }

    if (!clickedCard) {
      test.skip(true, "All rescue actions are disabled — cannot test selection");
      return;
    }

    // Now the "Aplicar solución" button should be enabled
    const applyButton = page.locator("button", {
      hasText: "Aplicar solución",
    });
    await expect(applyButton).toBeEnabled({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Rescue — Full flow: select action → apply → done → dashboard
// ---------------------------------------------------------------------------

test.describe("Rescue — Flujo completo: seleccionar acción y aplicar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe aplicar la solución seleccionada y mostrar el paso celebratorio", async ({
    page,
  }) => {
    // PRECONDITION: user must be in rescue mode
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);
    if (!bannerVisible) {
      test.skip(
        true,
        "User is NOT in rescue mode — cannot test full rescue flow. PRECONDITION: register enough expenses to exceed the budget.",
      );
      return;
    }

    // Navigate to /rescue
    await page.goto("/rescue");
    await page.waitForURL("**/rescue", { timeout: 10_000 });

    await expect(
      page.locator("h1").filter({ hasText: "sobre tu límite" }),
    ).toBeVisible({ timeout: 10_000 });

    // ── Select the first available (non-disabled) action card ──
    const actionCards = page
      .locator("button")
      .filter({ has: page.locator(".rounded-full.bg-destructive\\/10") });

    const actionCount = await actionCards.count();
    let clickedCard = false;

    for (let i = 0; i < actionCount; i++) {
      const card = actionCards.nth(i);
      const isDisabled = await card.isDisabled();
      if (!isDisabled) {
        await card.click();
        clickedCard = true;
        break;
      }
    }

    if (!clickedCard) {
      test.skip(true, "All rescue actions are disabled — cannot complete flow");
      return;
    }

    // ── Click "Aplicar solución" ──
    const applyButton = page.locator("button", {
      hasText: "Aplicar solución",
    });
    await expect(applyButton).toBeEnabled({ timeout: 3_000 });
    await applyButton.click();

    // The button text may change to "Aplicando..." while processing
    // Wait for the done step to appear

    // ── Done step: verify celebratory view ──
    // The DoneStep shows emoji 💪 and headline "Pequeño ajuste hecho."
    await expect(
      page.locator("h1", { hasText: "Pequeño ajuste hecho." }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the 💪 emoji is shown
    await expect(page.locator("text=💪").first()).toBeVisible();

    // Verify the subtitle
    await expect(
      page.locator("text=El próximo mes retomamos el plan completo"),
    ).toBeVisible();

    // Verify "Ir al dashboard" button
    const dashboardButton = page.locator("button", {
      hasText: "Ir al dashboard",
    });
    await expect(dashboardButton).toBeVisible();

    // Click "Ir al dashboard"
    await dashboardButton.click();

    // Verify we're back on the dashboard
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // After applying rescue, the rescue banner should no longer appear
    // (or the deficit should be resolved)
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Give the dashboard a moment to render the rescue status
    const rescueBannerAfter = await page
      .locator("text=Modo Rescate activado")
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    // The banner should be gone after applying rescue
    expect(rescueBannerAfter).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rescue — Second action: pause savings contribution
// ---------------------------------------------------------------------------

test.describe("Rescue — Pausar contribución a Ahorro", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe poder seleccionar 'Pausar contribución' y completar el flujo", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);
    if (!bannerVisible) {
      test.skip(
        true,
        "User is NOT in rescue mode — cannot test pause contribution flow",
      );
      return;
    }

    await page.goto("/rescue");
    await page.waitForURL("**/rescue", { timeout: 10_000 });

    await expect(
      page.locator("h1").filter({ hasText: "sobre tu límite" }),
    ).toBeVisible({ timeout: 10_000 });

    // Find the "Pausar" action card specifically
    const pauseCard = page
      .locator("button")
      .filter({ hasText: /Pausar/i })
      .first();

    const pauseVisible = await pauseCard.isVisible().catch(() => false);
    const pauseDisabled = pauseVisible
      ? await pauseCard.isDisabled()
      : true;

    if (!pauseVisible || pauseDisabled) {
      test.skip(
        true,
        "The 'Pausar contribución' action is not available or is disabled",
      );
      return;
    }

    // Select the pause card
    await pauseCard.click();

    // Verify it's selected (destructive border)
    await expect(pauseCard).toHaveClass(/border-destructive/, {
      timeout: 3_000,
    });

    // Apply the solution
    const applyButton = page.locator("button", {
      hasText: "Aplicar solución",
    });
    await expect(applyButton).toBeEnabled({ timeout: 3_000 });
    await applyButton.click();

    // Wait for the done step
    await expect(
      page.locator("h1", { hasText: "Pequeño ajuste hecho." }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the celebratory view
    await expect(page.locator("text=💪").first()).toBeVisible();
    await expect(
      page.locator("text=El próximo mes retomamos el plan completo"),
    ).toBeVisible();

    // Navigate to dashboard
    const dashboardButton = page.locator("button", {
      hasText: "Ir al dashboard",
    });
    await dashboardButton.click();

    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });
});

// ---------------------------------------------------------------------------
// Rescue — Transfer from savings
// ---------------------------------------------------------------------------

test.describe("Rescue — Mover desde Ahorro", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe poder seleccionar 'Mover desde Ahorro' y completar el flujo", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);
    if (!bannerVisible) {
      test.skip(
        true,
        "User is NOT in rescue mode — cannot test transfer from savings flow",
      );
      return;
    }

    await page.goto("/rescue");
    await page.waitForURL("**/rescue", { timeout: 10_000 });

    await expect(
      page.locator("h1").filter({ hasText: "sobre tu límite" }),
    ).toBeVisible({ timeout: 10_000 });

    // Find the "Mover" / transfer from savings card
    const transferCard = page
      .locator("button")
      .filter({ hasText: /Mover/i })
      .first();

    const transferVisible = await transferCard.isVisible().catch(() => false);
    const transferDisabled = transferVisible
      ? await transferCard.isDisabled()
      : true;

    if (!transferVisible || transferDisabled) {
      // The transfer action may be disabled if savings balance is 0
      // Check if the disabled reason is shown
      if (transferVisible) {
        const disabledReason = transferCard.locator(
          ".text-xs.text-muted-foreground.bg-muted",
        );
        const hasReason = await disabledReason.isVisible().catch(() => false);
        if (hasReason) {
          const reasonText = await disabledReason.textContent();
          console.log(
            `Transfer action disabled reason: ${reasonText}`,
          );
        }
      }
      test.skip(
        true,
        "The 'Mover desde Ahorro' action is not available or is disabled (possibly insufficient savings balance)",
      );
      return;
    }

    // Select the transfer card
    await transferCard.click();

    // Verify it's selected
    await expect(transferCard).toHaveClass(/border-destructive/, {
      timeout: 3_000,
    });

    // Apply the solution
    const applyButton = page.locator("button", {
      hasText: "Aplicar solución",
    });
    await expect(applyButton).toBeEnabled({ timeout: 3_000 });
    await applyButton.click();

    // Wait for the done step
    await expect(
      page.locator("h1", { hasText: "Pequeño ajuste hecho." }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the celebratory view
    await expect(page.locator("text=💪").first()).toBeVisible();

    // Navigate back to dashboard
    const dashboardButton = page.locator("button", {
      hasText: "Ir al dashboard",
    });
    await dashboardButton.click();

    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // The rescue banner should be gone
    const rescueBannerAfter = await page
      .locator("text=Modo Rescate activado")
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(rescueBannerAfter).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rescue — Non-rescue user redirected away from /rescue
// ---------------------------------------------------------------------------

test.describe("Rescue — Redirección si no está en modo rescate", () => {
  test("navegar a /rescue sin estar en déficit debe redirigir fuera", async ({
    page,
  }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
      return;
    }

    // Check if user is NOT in rescue mode
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    const bannerVisible = await isRescueBannerVisible(page);

    if (bannerVisible) {
      test.skip(
        true,
        "User IS in rescue mode — this test is for non-rescue users",
      );
      return;
    }

    // Navigate directly to /rescue
    await page.goto("/rescue");

    // The server-side guard in rescue/page.tsx checks:
    // if (!status || !status.isInRescue) redirect("/")
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        return path === "/" || path === "/dashboard" || path === "/login";
      },
      { timeout: 10_000 },
    );

    const redirectedPath = new URL(page.url()).pathname;
    expect(
      redirectedPath === "/" ||
        redirectedPath === "/dashboard" ||
        redirectedPath === "/login",
    ).toBe(true);
  });
});
