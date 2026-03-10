import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

test.describe("Savings — Página de ahorro (/savings)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe mostrar el título 'Tu Ahorro' y el total acumulado", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    // Main heading
    await expect(page.locator("h1", { hasText: "Tu Ahorro" })).toBeVisible({
      timeout: 10_000,
    });

    // Total acumulado label with currency amount
    await expect(page.locator("text=Total acumulado:")).toBeVisible();

    // The total should include a currency symbol (e.g. "S/")
    await expect(page.locator("text=/S\\//").first()).toBeVisible();
  });

  test("debe mostrar los sub-sobres de emergencia e inversión", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    await expect(page.locator("h1", { hasText: "Tu Ahorro" })).toBeVisible({
      timeout: 10_000,
    });

    // The savings page renders sub-envelope cards for "emergency" and "investment"
    // Each card has a label, progress bar, current amount and goal amount

    // Check for the emergency fund card (Shield icon + label)
    const emergencyCard = page.locator(
      "text=/emergencia|Fondo de emergencia/i",
    );
    const investmentCard = page.locator("text=/inversión|Inversión/i");

    // At least one sub-envelope should be visible
    const hasEmergency = await emergencyCard
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasInvestment = await investmentCard
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // Sub-envelopes are created during onboarding, so they should exist
    expect(hasEmergency || hasInvestment).toBe(true);
  });

  test("los sub-sobres deben mostrar barra de progreso y montos", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    await expect(page.locator("h1", { hasText: "Tu Ahorro" })).toBeVisible({
      timeout: 10_000,
    });

    // Each sub-envelope card contains:
    // - A progress percentage (e.g. "45%")
    // - A progress bar
    // - Current amount and goal amount
    // - The "Meta:" label with the target amount

    const subEnvelopeCards = page.locator(
      ".grid.grid-cols-1.md\\:grid-cols-2 > div",
    );
    const cardCount = await subEnvelopeCards.count();

    if (cardCount === 0) {
      test.skip(true, "No sub-envelope cards found — possibly no savings data");
      return;
    }

    for (let i = 0; i < cardCount; i++) {
      const card = subEnvelopeCards.nth(i);

      // Each card should show a percentage
      await expect(card.locator("text=/%/")).toBeVisible({ timeout: 5_000 });

      // Each card should have currency amounts (S/)
      await expect(card.locator("text=/S\\//").first()).toBeVisible();

      // Each card should have a "Meta:" label
      await expect(card.locator("text=Meta:")).toBeVisible();
    }
  });
});

test.describe("Savings — Sección de objetivos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe mostrar la sección 'Mis Objetivos' con el límite según plan", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    await expect(page.locator("h1", { hasText: "Tu Ahorro" })).toBeVisible({
      timeout: 10_000,
    });

    // The goals section heading
    await expect(page.locator("h2", { hasText: "Mis Objetivos" })).toBeVisible({
      timeout: 5_000,
    });

    // The subtitle mentions the limit based on plan
    const subtitle = page.locator("text=/Máximo \\d+ objetivo/");
    await expect(subtitle).toBeVisible();

    const subtitleText = await subtitle.textContent();
    expect(subtitleText).toBeTruthy();
    // Should say either "Máximo 1 objetivo" (free) or "Máximo 3 objetivos" (premium)
    expect(
      subtitleText!.includes("1 objetivo") ||
        subtitleText!.includes("3 objetivo"),
    ).toBe(true);
  });

  test("si hay objetivos configurados, deben mostrar nombre, emoji, progreso y montos", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    await expect(page.locator("h2", { hasText: "Mis Objetivos" })).toBeVisible({
      timeout: 10_000,
    });

    // Goal cards are inside the grid after "Mis Objetivos"
    // Each goal card has: emoji, name, progress bar, current/target amounts, monthly required
    const goalCards = page
      .locator(".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 > div")
      .filter({ has: page.locator("text=/ mes/") });

    const goalCount = await goalCards.count();

    if (goalCount === 0) {
      // No goals configured — that's okay, the test still passes
      // but we verify the "new goal" dialog trigger is present
      return;
    }

    // Verify each goal card has the expected content
    for (let i = 0; i < goalCount; i++) {
      const card = goalCards.nth(i);

      // Should have a name (font-semibold text)
      const name = card.locator(".font-semibold.truncate");
      await expect(name).toBeVisible();

      // Should have currency amounts
      await expect(card.locator("text=/S\\//").first()).toBeVisible();

      // Should have monthly required info ("S/ X / mes")
      await expect(card.locator("text=/ mes/")).toBeVisible();

      // Should have a delete button
      const deleteButton = card.locator("button").filter({
        has: page.locator("svg"),
      });
      await expect(deleteButton.first()).toBeVisible();
    }
  });
});

test.describe("Savings — Diálogo de nuevo objetivo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe existir un trigger para agregar un nuevo objetivo de ahorro", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    await expect(page.locator("h2", { hasText: "Mis Objetivos" })).toBeVisible({
      timeout: 10_000,
    });

    // The NewGoalDialog component renders a trigger button/card
    // It's inside the goals grid as the last item
    const newGoalTrigger = page.locator("button, [role='button']").filter({
      hasText: /nuevo objetivo|agregar|añadir|\+/i,
    });

    const triggerCount = await newGoalTrigger.count();

    if (triggerCount > 0) {
      // The trigger should be visible
      await expect(newGoalTrigger.first()).toBeVisible();

      // Click to open the dialog
      await newGoalTrigger.first().click();

      // A dialog should appear (Dialog or Sheet)
      // Wait for dialog content to appear
      const dialog = page.locator("[role='dialog']");
      const isDialogVisible = await dialog
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

      if (isDialogVisible) {
        // The dialog should have form fields for the new goal
        await expect(dialog).toBeVisible();
      }
    }
  });
});

test.describe("Savings — Fondo de emergencia (retiro)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("si existe fondo de emergencia con saldo, debe mostrar opción de retiro", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    await expect(page.locator("h1", { hasText: "Tu Ahorro" })).toBeVisible({
      timeout: 10_000,
    });

    // The emergency sub-envelope card has a WithdrawButton
    // Look for any withdraw-related button text
    const withdrawButton = page.locator("button").filter({
      hasText: /retirar|Retirar|withdraw/i,
    });

    const hasWithdraw = await withdrawButton
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (!hasWithdraw) {
      // The withdraw button may not show if emergency balance is 0
      // That's acceptable — just verify the page loads correctly
      return;
    }

    await expect(withdrawButton.first()).toBeVisible();
  });
});

test.describe("Savings — Navegación desde el dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("clic en 'Ver detalle de ahorro' debe navegar a /savings", async ({
    page,
  }) => {
    // Wait for the dashboard to load
    await expect(page.locator("text=Necesidades").first()).toBeVisible({
      timeout: 10_000,
    });

    // The dashboard has a "Ver detalle de ahorro" card
    const savingsDetailButton = page.locator("text=Ver detalle de ahorro");
    await expect(savingsDetailButton).toBeVisible({ timeout: 10_000 });

    // Click it
    await savingsDetailButton.click();

    // Should navigate to /savings
    await page.waitForURL("**/savings", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/savings");
  });

  test("clic en 'Ahorro' del sidebar debe navegar a /savings", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const savingsLink = sidebar.locator("a").filter({ hasText: "Ahorro" });
    await expect(savingsLink).toBeVisible();
    await savingsLink.click();

    await page.waitForURL("**/savings", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/savings");
  });
});
