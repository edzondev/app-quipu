import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

test.describe("Dashboard — Sobres visibles", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe mostrar los tres sobres: Necesidades, Gustos, Ahorro", async ({
    page,
  }) => {
    // Wait for the envelope cards to render (they have staggered animations)
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Gustos").first()).toBeVisible();
    await expect(page.locator("text=Ahorro").first()).toBeVisible();
  });

  test("cada sobre debe mostrar un monto con formato de moneda", async ({
    page,
  }) => {
    // Wait for envelopes to load
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // The envelope cards display amounts in format like "S/ 1,500" or "S/ 0"
    // Each EnvelopeCard renders the amount with the currencySymbol (e.g. "S/")
    // Look for amount patterns inside envelope cards
    const envelopeCards = page.locator('[class*="animate-in"]').filter({
      has: page.locator("text=/^(🏠|🎉|💰)/"),
    });

    const cardCount = await envelopeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Each card should contain a formatted amount (S/ followed by a number)
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = envelopeCards.nth(i);
      await expect(card.locator("text=/S\\//")).toBeVisible();
    }
  });
});

test.describe("Dashboard — FAB (botón flotante)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("el FAB de registro rápido debe estar visible en el dashboard", async ({
    page,
  }) => {
    // The FAB is a fixed button with aria-label="Registro rápido de gasto"
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Dashboard — Botón de registrar ingreso según workerType", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("trabajador independiente: debe ver botón '+ Registrar ingreso de hoy'", async ({
    page,
  }) => {
    // Wait for dashboard content to load
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Check if the user is independent by looking for the register income button
    const registerIncomeButton = page.locator("a", {
      hasText: "+ Registrar ingreso de hoy",
    });

    // Also check for the sidebar item to determine worker type
    const sidebarRegisterIncome = page.locator('[data-sidebar="sidebar"]').locator("text=Registrar Ingreso");
    const sidebarPayday = page.locator('[data-sidebar="sidebar"]').locator("text=Día de pago");

    const isIndependent = await sidebarRegisterIncome.isVisible().catch(() => false);
    const isDependent = await sidebarPayday.isVisible().catch(() => false);

    if (isIndependent) {
      // Independent worker should see the register income button
      await expect(registerIncomeButton).toBeVisible();
    } else if (isDependent) {
      // Dependent worker should NOT see the register income button
      await expect(registerIncomeButton).not.toBeVisible();
    }
  });

  test("trabajador dependiente: NO debe ver botón '+ Registrar ingreso de hoy'", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Necesidades").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Check sidebar to determine worker type
    const sidebarPayday = page.locator('[data-sidebar="sidebar"]').locator("text=Día de pago");
    const isDependent = await sidebarPayday.isVisible().catch(() => false);

    if (!isDependent) {
      test.skip(true, "Test user is not a dependent worker — skipping");
      return;
    }

    const registerIncomeButton = page.locator("a", {
      hasText: "+ Registrar ingreso de hoy",
    });
    await expect(registerIncomeButton).not.toBeVisible();
  });
});

test.describe("Dashboard — Sidebar opciones de navegación", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("el sidebar debe mostrar las opciones de navegación principales", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Common nav items for all users
    await expect(sidebar.locator("text=Dashboard")).toBeVisible();
    await expect(sidebar.locator("text=Gastos")).toBeVisible();
    await expect(sidebar.locator("text=Ahorro")).toBeVisible();
    await expect(sidebar.locator("text=Logros")).toBeVisible();
    await expect(sidebar.locator("text=Registrar gasto")).toBeVisible();
  });

  test("el sidebar debe mostrar la opción correcta según el tipo de trabajador", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const hasRegisterIncome = await sidebar
      .locator("text=Registrar Ingreso")
      .isVisible()
      .catch(() => false);
    const hasPayday = await sidebar
      .locator("text=Día de pago")
      .isVisible()
      .catch(() => false);

    // One of them must be visible depending on workerType
    expect(hasRegisterIncome || hasPayday).toBe(true);

    // They should be mutually exclusive
    if (hasRegisterIncome) {
      await expect(sidebar.locator("text=Día de pago")).not.toBeVisible();
    }
    if (hasPayday) {
      await expect(sidebar.locator("text=Registrar Ingreso")).not.toBeVisible();
    }
  });

  test("el sidebar debe mostrar el nombre del usuario en el footer", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // The NavUser component shows the user's name in the sidebar footer
    // It's inside a SidebarFooter > SidebarMenuButton with the user's name
    const sidebarFooter = sidebar.locator('[data-sidebar="footer"]');
    await expect(sidebarFooter).toBeVisible();

    // The footer should contain some text (the user's name)
    const footerText = await sidebarFooter.textContent();
    expect(footerText).toBeTruthy();
    expect(footerText!.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Dashboard — Elementos adicionales", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("debe mostrar el resumen del mes con días restantes", async ({
    page,
  }) => {
    await expect(
      page.locator("text=/\\d+ días restantes en el mes/"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("debe mostrar la sección de racha", async ({ page }) => {
    await expect(
      page.locator("text=/Racha: \\d+ meses consecutivos/"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("debe mostrar la card del coach financiero", async ({ page }) => {
    await expect(
      page.locator("text=Coach financiero"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("debe mostrar la sección de gastos recientes", async ({ page }) => {
    await expect(
      page.locator("text=Gastos recientes"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("debe mostrar la card de ver detalle de ahorro", async ({ page }) => {
    await expect(
      page.locator("text=Ver detalle de ahorro"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("la barra de progreso del presupuesto debe ser visible", async ({
    page,
  }) => {
    // The progress bar is inside the month summary bar
    await expect(
      page.locator("text=/\\d+% del presupuesto usado/"),
    ).toBeVisible({ timeout: 10_000 });
  });
});
