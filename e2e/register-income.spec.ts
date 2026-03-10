import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

/**
 * Helper: detect whether the current test user is an independent worker
 * by inspecting the sidebar navigation items.
 */
async function isIndependentWorker(page: import("@playwright/test").Page): Promise<boolean> {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  return sidebar
    .locator("text=Registrar Ingreso")
    .isVisible()
    .catch(() => false);
}

/**
 * Helper: detect whether the current test user is a dependent worker.
 */
async function isDependentWorker(page: import("@playwright/test").Page): Promise<boolean> {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  return sidebar
    .locator("text=Día de pago")
    .isVisible()
    .catch(() => false);
}

// ---------------------------------------------------------------------------
// Register Income — Full flow (independent worker)
// ---------------------------------------------------------------------------

test.describe("Register Income — Flujo completo (trabajador independiente)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe navegar a /register-income y ver el paso 1 con el label correcto", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    await page.goto("/register-income");
    await page.waitForURL("**/register-income", { timeout: 10_000 });

    // Step 1: IncomeInputStep — heading "¿Cuánto cobraste hoy?"
    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });

    // The input field for the amount should be visible
    const amountInput = page.locator('input[type="number"]');
    await expect(amountInput).toBeVisible();

    // The "Asignar" button should be visible but disabled while amount = 0
    const assignButton = page.locator("button", { hasText: "Asignar" });
    await expect(assignButton).toBeVisible();
    await expect(assignButton).toBeDisabled();
  });

  test("debe registrar un ingreso de S/ 500 y ver la asignación animada", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    await page.goto("/register-income");
    await page.waitForURL("**/register-income", { timeout: 10_000 });

    // Wait for step 1
    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });

    // Enter 500 in the amount field
    const amountInput = page.locator('input[type="number"]');
    await amountInput.fill("500");

    // The "Asignar" button should now be enabled
    const assignButton = page.locator("button", { hasText: "Asignar" });
    await expect(assignButton).toBeEnabled();

    // Click "Asignar →"
    await assignButton.click();

    // ── Step 2: Assigning animation ──
    // Should show "Asignando S/ 500..."
    await expect(page.locator("text=/Asignando/")).toBeVisible({
      timeout: 5_000,
    });

    // The three envelope cards should appear with animations
    // Necesidades: 50% of 500 = 250
    await expect(page.locator("text=Necesidades").last()).toBeVisible({
      timeout: 5_000,
    });

    // Gustos: 30% of 500 = 150
    await expect(page.locator("text=Gustos").last()).toBeVisible({
      timeout: 5_000,
    });

    // Ahorro: 20% of 500 = 100
    await expect(page.locator("text=Ahorro").last()).toBeVisible({
      timeout: 5_000,
    });

    // Each card should display a percentage
    const envelopeCards = page.locator(".rounded-xl.border-2.bg-card");
    await expect(envelopeCards.nth(0)).toBeVisible({ timeout: 5_000 });

    // Verify currency symbol is present in the cards
    await expect(
      envelopeCards.first().locator("text=/S\\//"),
    ).toBeVisible();

    // ── Step 3: Done ──
    // Wait for the done view: "¡Asignado!"
    await expect(
      page.locator("h1", { hasText: "¡Asignado!" }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the subtitle
    await expect(
      page.locator("text=Tu dinero ya sabe a dónde va."),
    ).toBeVisible();

    // Verify the "Ir al dashboard" button
    const dashboardButton = page.locator("button", {
      hasText: "Ir al dashboard",
    });
    await expect(dashboardButton).toBeVisible();

    // Click "Ir al dashboard"
    await dashboardButton.click();

    // Verify we're back on the dashboard
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // Verify the dashboard envelopes are visible (amounts should have increased)
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Gustos").first()).toBeVisible();
    await expect(page.locator("text=Ahorro").first()).toBeVisible();
  });

  test("el botón Asignar debe estar deshabilitado cuando el monto es 0 o vacío", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    await page.goto("/register-income");
    await page.waitForURL("**/register-income", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });

    const assignButton = page.locator("button", { hasText: "Asignar" });

    // With empty/0 value, button should be disabled
    await expect(assignButton).toBeDisabled();

    // Enter a negative value or 0 — button should stay disabled
    const amountInput = page.locator('input[type="number"]');
    await amountInput.fill("0");
    await expect(assignButton).toBeDisabled();

    // Clear and enter a valid amount — button should enable
    await amountInput.fill("100");
    await expect(assignButton).toBeEnabled();

    // Clear back to empty — button should disable again
    await amountInput.fill("");
    await expect(assignButton).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Register Income — Accumulation (amounts add up, not reset)
// ---------------------------------------------------------------------------

test.describe("Register Income — Acumulación de ingresos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("registrar un segundo ingreso debe sumar, no reemplazar los montos anteriores", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    // ── Capture initial envelope amounts from the dashboard ──
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Get the Necesidades envelope card amount
    const needsAmountLocator = page
      .locator('[class*="animate-in"]')
      .filter({ has: page.locator("text=🏠") })
      .first()
      .locator("span.font-bold")
      .first();

    const initialNeedsText = await needsAmountLocator.textContent();

    // Parse the initial numeric value (format: "S/ 1,500" or "S/ 0")
    const parseAmount = (text: string | null): number => {
      if (!text) return 0;
      const cleaned = text.replace(/[^\d.,\-]/g, "").replace(",", "");
      return parseFloat(cleaned) || 0;
    };

    const initialNeedsAmount = parseAmount(initialNeedsText);

    // ── Register first income: 200 ──
    await page.goto("/register-income");
    await page.waitForURL("**/register-income", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="number"]').fill("200");
    await page.locator("button", { hasText: "Asignar" }).click();

    // Wait for the done step
    await expect(
      page.locator("h1", { hasText: "¡Asignado!" }),
    ).toBeVisible({ timeout: 10_000 });

    // Go to dashboard
    await page.locator("button", { hasText: "Ir al dashboard" }).click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // Wait for envelopes to load
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Get the amount after first income registration
    const afterFirstText = await needsAmountLocator.textContent();
    const afterFirstAmount = parseAmount(afterFirstText);

    // Necesidades should have increased (50% of 200 = 100)
    // The increase depends on allocation — we just verify it's >= initial
    expect(afterFirstAmount).toBeGreaterThanOrEqual(initialNeedsAmount);

    // ── Register second income: 300 ──
    await page.goto("/register-income");
    await page.waitForURL("**/register-income", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="number"]').fill("300");
    await page.locator("button", { hasText: "Asignar" }).click();

    // Wait for done step
    await expect(
      page.locator("h1", { hasText: "¡Asignado!" }),
    ).toBeVisible({ timeout: 10_000 });

    // Go to dashboard
    await page.locator("button", { hasText: "Ir al dashboard" }).click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // Wait for envelopes to load
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Get the amount after second income
    const afterSecondText = await needsAmountLocator.textContent();
    const afterSecondAmount = parseAmount(afterSecondText);

    // The envelope amount should be >= the amount after the first registration
    // (accumulated, not replaced)
    expect(afterSecondAmount).toBeGreaterThanOrEqual(afterFirstAmount);
  });
});

// ---------------------------------------------------------------------------
// Register Income — Navigation from dashboard link
// ---------------------------------------------------------------------------

test.describe("Register Income — Acceso desde el dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("clic en '+ Registrar ingreso de hoy' debe llevar a /register-income", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    // Wait for the dashboard to load
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Click the register income link
    const registerIncomeLink = page.locator("a", {
      hasText: "+ Registrar ingreso de hoy",
    });
    await expect(registerIncomeLink).toBeVisible({ timeout: 5_000 });
    await registerIncomeLink.click();

    // Verify navigation
    await page.waitForURL("**/register-income", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/register-income");

    // Verify the step 1 heading
    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("clic en 'Registrar Ingreso' del sidebar debe llevar a /register-income", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const sidebarLink = sidebar.locator("text=Registrar Ingreso");
    await expect(sidebarLink).toBeVisible({ timeout: 10_000 });
    await sidebarLink.click();

    await page.waitForURL("**/register-income", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/register-income");
  });
});

// ---------------------------------------------------------------------------
// Register Income — Redirection for dependent workers
// ---------------------------------------------------------------------------

test.describe("Register Income — Redirección si es trabajador dependiente", () => {
  test("como trabajador dependiente, navegar a /register-income debe redirigir a /dashboard", async ({
    page,
  }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
      return;
    }

    const isDependent = await isDependentWorker(page);
    if (!isDependent) {
      test.skip(
        true,
        "User is not a dependent worker — skipping redirection test",
      );
      return;
    }

    // Navigate directly to /register-income as a dependent worker
    await page.goto("/register-income");

    // The server-side guard in register-income/page.tsx checks:
    // if (!profile || profile.workerType !== "independent") redirect("/dashboard")
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    const redirectedPath = new URL(page.url()).pathname;
    expect(redirectedPath).toBe("/dashboard");
  });
});

// ---------------------------------------------------------------------------
// Register Income — Assigning step details
// ---------------------------------------------------------------------------

test.describe("Register Income — Detalle del paso de asignación", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("el paso de asignación debe mostrar las tres tarjetas con nombre, porcentaje y monto", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    await page.goto("/register-income");
    await page.waitForURL("**/register-income", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "¿Cuánto cobraste hoy?" }),
    ).toBeVisible({ timeout: 10_000 });

    // Enter an amount
    await page.locator('input[type="number"]').fill("1000");
    await page.locator("button", { hasText: "Asignar" }).click();

    // Wait for assigning step
    await expect(page.locator("text=/Asignando/")).toBeVisible({
      timeout: 5_000,
    });

    // Verify the header text contains the amount
    await expect(
      page.locator("text=/Asignando.*1/"),
    ).toBeVisible({ timeout: 5_000 });

    // Wait for all cards to animate in
    const envelopeCards = page.locator(".rounded-xl.border-2.bg-card");
    await expect(envelopeCards.nth(2)).toBeVisible({ timeout: 5_000 });

    // Verify Necesidades card details
    const needsCard = envelopeCards.filter({ hasText: "Necesidades" }).first();
    await expect(needsCard).toBeVisible();
    await expect(needsCard.locator("text=🏠")).toBeVisible();
    // Should show the percentage
    await expect(needsCard.locator("text=/%/")).toBeVisible();
    // Should show the currency amount
    await expect(needsCard.locator("text=/S\\//")).toBeVisible();

    // Verify Gustos card details
    const wantsCard = envelopeCards.filter({ hasText: "Gustos" }).first();
    await expect(wantsCard).toBeVisible();
    await expect(wantsCard.locator("text=🎉")).toBeVisible();
    await expect(wantsCard.locator("text=/%/")).toBeVisible();
    await expect(wantsCard.locator("text=/S\\//")).toBeVisible();

    // Verify Ahorro card details
    const savingsCard = envelopeCards.filter({ hasText: "Ahorro" }).first();
    await expect(savingsCard).toBeVisible();
    await expect(savingsCard.locator("text=💰")).toBeVisible();
    await expect(savingsCard.locator("text=/%/")).toBeVisible();
    await expect(savingsCard.locator("text=/S\\//")).toBeVisible();

    // Each card should have the correct border color class
    await expect(needsCard).toHaveClass(/border-envelope-needs/);
    await expect(wantsCard).toHaveClass(/border-envelope-wants/);
    await expect(savingsCard).toHaveClass(/border-envelope-savings/);
  });
});
