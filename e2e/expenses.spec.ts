import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

test.describe("Expenses — Registro desde el FAB", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe abrir el drawer, seleccionar sobre, ingresar monto y registrar gasto", async ({
    page,
  }) => {
    // Wait for dashboard to fully load with envelopes
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Capture the initial available amount for Necesidades from the envelope card
    // The envelope card shows the amount in the format "S/ X,XXX"
    const needsCard = page
      .locator('[class*="animate-in"]')
      .filter({ has: page.locator("text=🏠") })
      .first();
    await expect(needsCard).toBeVisible({ timeout: 10_000 });

    // Click the FAB button
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).toBeVisible({ timeout: 10_000 });
    await fab.click();

    // Wait for the drawer to open — it should have the title "Gasto rápido"
    await expect(page.locator("text=Gasto rápido")).toBeVisible({
      timeout: 5_000,
    });

    // The drawer should show envelope cards for selection
    const drawerContent = page.locator('[data-vaul-drawer]');

    // Select the "Necesidades" envelope inside the drawer
    // The envelope buttons in the drawer show emoji + label
    const needsEnvelopeButton = drawerContent
      .locator("button")
      .filter({ hasText: "Necesidades" })
      .first();

    // If the drawerContent locator doesn't find the buttons, fall back to page-level
    const needsButton = (await needsEnvelopeButton.isVisible().catch(() => false))
      ? needsEnvelopeButton
      : page.locator("button").filter({ hasText: "Necesidades" }).last();

    await needsButton.click();

    // Verify the envelope is selected (border changes)
    await expect(needsButton).toHaveClass(/border-purple-500/, {
      timeout: 3_000,
    });

    // Use the numeric keypad to enter 85
    // The keypad buttons are inside the drawer: "1"-"9", "0", ".", "delete"
    const keypadContainer = page.locator(".grid.grid-cols-3");
    const key8 = keypadContainer.locator("button", { hasText: /^8$/ });
    const key5 = keypadContainer.locator("button", { hasText: /^5$/ });

    await key8.click();
    await key5.click();

    // Verify the display shows "85"
    const amountDisplay = page.locator("text=/^85$/").first();
    await expect(amountDisplay).toBeVisible({ timeout: 3_000 });

    // Click "Registrar"
    const registerButton = page.locator("button", { hasText: "Registrar" });
    await expect(registerButton).toBeVisible();
    await registerButton.click();

    // Wait for the drawer to close / the expense to be saved
    // After registration, the drawer should close and the dashboard should update
    await expect(page.locator("text=Gasto rápido")).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test("debe manejar montos con decimal correctamente", async ({ page }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Open FAB
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await fab.click();
    await expect(page.locator("text=Gasto rápido")).toBeVisible({
      timeout: 5_000,
    });

    // Select an envelope (Gustos)
    const gustosButton = page
      .locator("button")
      .filter({ hasText: "Gustos" })
      .last();
    await gustosButton.click();

    // Enter 12.50 using the keypad
    const keypadContainer = page.locator(".grid.grid-cols-3");
    const key1 = keypadContainer.locator("button", { hasText: /^1$/ });
    const key2 = keypadContainer.locator("button", { hasText: /^2$/ });
    const keyDot = keypadContainer.locator("button", { hasText: /^\.$/ });
    const key5 = keypadContainer.locator("button", { hasText: /^5$/ });
    const key0 = keypadContainer.locator("button", { hasText: /^0$/ });

    await key1.click();
    await key2.click();
    await keyDot.click();
    await key5.click();
    await key0.click();

    // Verify the display shows the decimal value correctly
    // The display should show "12.50" or "12.5" — the important thing is
    // it should NOT show "1250" or "12"
    const display = page.locator(".text-3xl.font-bold.tracking-tight");
    const displayText = await display.textContent();
    expect(displayText).toBeTruthy();
    // The value should contain a decimal point
    expect(displayText!.includes(".")).toBe(true);
    // The numeric value should be approximately 12.5
    const numericValue = parseFloat(displayText!.replace(/[^0-9.]/g, ""));
    expect(numericValue).toBeGreaterThanOrEqual(12);
    expect(numericValue).toBeLessThanOrEqual(13);
  });
});

test.describe("Expenses — Validaciones del FAB", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("no debe registrar con monto 0 (botón deshabilitado o error)", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Open FAB
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await fab.click();
    await expect(page.locator("text=Gasto rápido")).toBeVisible({
      timeout: 5_000,
    });

    // Select an envelope
    const needsButton = page
      .locator("button")
      .filter({ hasText: "Necesidades" })
      .last();
    await needsButton.click();

    // Don't enter any amount — the display should show 0 or be empty
    // Try to submit
    const registerButton = page.locator("button", { hasText: "Registrar" });
    await registerButton.click();

    // The drawer should remain open because the form validation should fail
    // (amount = 0 is invalid). Either an error message appears or the
    // drawer simply stays open.
    await expect(page.locator("text=Gasto rápido")).toBeVisible({
      timeout: 3_000,
    });
  });

  test("no debe registrar sin seleccionar sobre (muestra error de validación)", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Open FAB
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await fab.click();
    await expect(page.locator("text=Gasto rápido")).toBeVisible({
      timeout: 5_000,
    });

    // Enter an amount WITHOUT selecting an envelope
    const keypadContainer = page.locator(".grid.grid-cols-3");
    const key5 = keypadContainer.locator("button", { hasText: /^5$/ });
    const key0 = keypadContainer.locator("button", { hasText: /^0$/ });

    await key5.click();
    await key0.click();

    // Try to submit without envelope selection
    const registerButton = page.locator("button", { hasText: "Registrar" });
    await registerButton.click();

    // The drawer should remain open — form validation prevents submission
    await expect(page.locator("text=Gasto rápido")).toBeVisible({
      timeout: 3_000,
    });
  });
});

test.describe("Expenses — Registro desde página dedicada (/add-expense)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe poder registrar un gasto desde la página /add-expense", async ({
    page,
  }) => {
    await page.goto("/add-expense");
    await page.waitForURL("**/add-expense", { timeout: 10_000 });

    // Wait for the form to load — it has a skeleton state while loading
    await expect(
      page.locator("h1", { hasText: "Registrar gasto" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("text=¿En qué sobre va este gasto?")).toBeVisible();

    // Select the Necesidades envelope card
    const needsCard = page.locator("button").filter({ hasText: "Necesidades" }).first();
    await expect(needsCard).toBeVisible({ timeout: 5_000 });
    await needsCard.click();

    // Verify the envelope card is selected
    await expect(needsCard).toHaveClass(/border-primary/);

    // Fill in the amount using the regular input field
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill("45");

    // Optionally fill description
    const descriptionInput = page.locator('input[placeholder="¿En qué gastaste?"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill("Gasto de prueba E2E");
    }

    // Click "Registrar gasto"
    const submitButton = page.locator("button", { hasText: "Registrar gasto" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for the form to process (button text changes to "Registrando...")
    // then the form should either redirect or reset
    await expect(submitButton).not.toHaveText("Registrando...", {
      timeout: 10_000,
    });
  });

  test("no debe registrar sin seleccionar sobre en la página dedicada", async ({
    page,
  }) => {
    await page.goto("/add-expense");
    await page.waitForURL("**/add-expense", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "Registrar gasto" }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill amount but don't select an envelope
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill("100");

    // Submit
    const submitButton = page.locator("button", { hasText: "Registrar gasto" });
    await submitButton.click();

    // Should remain on the same page — form validation should fail
    await expect(
      page.locator("h1", { hasText: "Registrar gasto" }),
    ).toBeVisible({ timeout: 3_000 });
  });

  test("no debe registrar con monto vacío en la página dedicada", async ({
    page,
  }) => {
    await page.goto("/add-expense");
    await page.waitForURL("**/add-expense", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "Registrar gasto" }),
    ).toBeVisible({ timeout: 10_000 });

    // Select an envelope but leave amount empty
    const gustosCard = page.locator("button").filter({ hasText: "Gustos" }).first();
    await gustosCard.click();

    // Submit
    const submitButton = page.locator("button", { hasText: "Registrar gasto" });
    await submitButton.click();

    // Should remain on the same page
    await expect(
      page.locator("h1", { hasText: "Registrar gasto" }),
    ).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("Expenses — Página de historial (/expenses)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe mostrar la página de gastos con título y resumen", async ({
    page,
  }) => {
    await page.goto("/expenses");
    await page.waitForURL("**/expenses", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "Gastos" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator("text=Historial completo de tus transacciones"),
    ).toBeVisible();
  });
});
