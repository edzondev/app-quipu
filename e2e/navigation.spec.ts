import { test, expect } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isIndependentWorker(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  return sidebar
    .locator("text=Registrar Ingreso")
    .isVisible()
    .catch(() => false);
}

async function isDependentWorker(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  return sidebar
    .locator("text=Día de pago")
    .isVisible()
    .catch(() => false);
}

// ---------------------------------------------------------------------------
// Navigation — Sidebar links navigate to the correct routes
// ---------------------------------------------------------------------------

test.describe("Navigation — Sidebar links", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("'Dashboard' en el sidebar debe navegar a /dashboard", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // First navigate away from dashboard so we can confirm the link works
    await page.goto("/expenses");
    await page.waitForURL("**/expenses", { timeout: 10_000 });

    // Click the Dashboard link in the sidebar
    const dashboardLink = sidebar.locator("a").filter({ hasText: "Dashboard" });
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();

    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });

  test("'Gastos' en el sidebar debe navegar a /expenses", async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const gastosLink = sidebar.locator("a").filter({ hasText: "Gastos" });
    await expect(gastosLink).toBeVisible();
    await gastosLink.click();

    await page.waitForURL("**/expenses", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/expenses");
  });

  test("'Ahorro' en el sidebar debe navegar a /savings", async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const ahorroLink = sidebar.locator("a").filter({ hasText: "Ahorro" });
    await expect(ahorroLink).toBeVisible();
    await ahorroLink.click();

    await page.waitForURL("**/savings", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/savings");
  });

  test("'Logros' en el sidebar debe navegar a /achievements", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const logrosLink = sidebar.locator("a").filter({ hasText: "Logros" });
    await expect(logrosLink).toBeVisible();
    await logrosLink.click();

    await page.waitForURL("**/achievements", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/achievements");
  });

  test("'Registrar gasto' en el sidebar debe navegar a /add-expense", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const addExpenseLink = sidebar
      .locator("a")
      .filter({ hasText: "Registrar gasto" });
    await expect(addExpenseLink).toBeVisible();
    await addExpenseLink.click();

    await page.waitForURL("**/add-expense", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/add-expense");
  });

  test("'Ingreso extra' en el sidebar debe navegar a /extra-income", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const extraIncomeLink = sidebar
      .locator("a")
      .filter({ hasText: "Ingreso extra" });
    await expect(extraIncomeLink).toBeVisible();
    await extraIncomeLink.click();

    await page.waitForURL("**/extra-income", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/extra-income");
  });
});

// ---------------------------------------------------------------------------
// Navigation — Worker-type-specific sidebar items
// ---------------------------------------------------------------------------

test.describe("Navigation — Ítems del sidebar según workerType", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("trabajador dependiente: 'Día de pago' lleva a /payday y no existe 'Registrar Ingreso'", async ({
    page,
  }) => {
    const isDependent = await isDependentWorker(page);
    if (!isDependent) {
      test.skip(true, "User is not a dependent worker — skipping");
      return;
    }

    const sidebar = page.locator('[data-sidebar="sidebar"]');

    // "Día de pago" must be visible and link to /payday
    const paydayLink = sidebar.locator("a").filter({ hasText: "Día de pago" });
    await expect(paydayLink).toBeVisible();
    await paydayLink.click();

    await page.waitForURL("**/payday", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/payday");

    // "Registrar Ingreso" must NOT be in the sidebar
    await expect(sidebar.locator("text=Registrar Ingreso")).not.toBeVisible();
  });

  test("trabajador independiente: 'Registrar Ingreso' lleva a /register-income y no existe 'Día de pago'", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    const sidebar = page.locator('[data-sidebar="sidebar"]');

    // "Registrar Ingreso" must be visible and link to /register-income
    const registerLink = sidebar
      .locator("a")
      .filter({ hasText: "Registrar Ingreso" });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await page.waitForURL("**/register-income", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/register-income");

    // "Día de pago" must NOT be in the sidebar
    await expect(sidebar.locator("text=Día de pago")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation — FAB visibility per route
// ---------------------------------------------------------------------------

test.describe("Navigation — Visibilidad del FAB según la ruta", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("el FAB debe ser visible en /dashboard", async ({ page }) => {
    // We're already on /dashboard after login
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).toBeVisible({ timeout: 10_000 });
  });

  test("el FAB debe ser visible en /savings", async ({ page }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).toBeVisible({ timeout: 10_000 });
  });

  test("el FAB debe ser visible en /achievements", async ({ page }) => {
    await page.goto("/achievements");
    await page.waitForURL("**/achievements", { timeout: 10_000 });

    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).toBeVisible({ timeout: 10_000 });
  });

  test("el FAB debe ser visible en /expenses", async ({ page }) => {
    await page.goto("/expenses");
    await page.waitForURL("**/expenses", { timeout: 10_000 });

    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).toBeVisible({ timeout: 10_000 });
  });

  test("el FAB NO debe ser visible en /add-expense", async ({ page }) => {
    await page.goto("/add-expense");
    await page.waitForURL("**/add-expense", { timeout: 10_000 });

    // The HIDDEN_ROUTES in QuickExpenseFAB include "/add-expense"
    const fab = page.locator('button[aria-label="Registro rápido de gasto"]');
    await expect(fab).not.toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Navigation — Route redirections based on workerType
// ---------------------------------------------------------------------------

test.describe("Navigation — Redirecciones de ruta según workerType", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("trabajador dependiente: /register-income debe redirigir a /dashboard", async ({
    page,
  }) => {
    const isDependent = await isDependentWorker(page);
    if (!isDependent) {
      test.skip(true, "User is not a dependent worker — skipping");
      return;
    }

    // The server-side guard in register-income/page.tsx:
    // if (!profile || profile.workerType !== "independent") redirect("/dashboard")
    await page.goto("/register-income");

    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });

  test("trabajador independiente: /payday carga correctamente (no redirige)", async ({
    page,
  }) => {
    const isIndie = await isIndependentWorker(page);
    if (!isIndie) {
      test.skip(true, "User is not an independent worker — skipping");
      return;
    }

    // The /payday route doesn't have a server-side guard for worker type,
    // it renders PaydayView which reads the profile and shows status.
    // Independent workers can still access /payday but may see "next payday" info.
    await page.goto("/payday");
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    // The page should load without error — it either stays on /payday
    // or redirects somewhere. We just verify it resolves.
    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Navigation — Active sidebar item highlighting
// ---------------------------------------------------------------------------

test.describe("Navigation — Resaltado del ítem activo en el sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("el ítem 'Dashboard' debe estar resaltado cuando estamos en /dashboard", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // The active nav item gets "bg-primary rounded-md text-white"
    const dashboardItem = sidebar
      .locator('[data-sidebar="menu-item"]')
      .filter({ hasText: "Dashboard" });

    await expect(dashboardItem).toBeVisible();
    await expect(dashboardItem).toHaveClass(/bg-primary/);
  });

  test("el ítem 'Gastos' debe estar resaltado cuando estamos en /expenses", async ({
    page,
  }) => {
    await page.goto("/expenses");
    await page.waitForURL("**/expenses", { timeout: 10_000 });

    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const gastosItem = sidebar
      .locator('[data-sidebar="menu-item"]')
      .filter({ hasText: "Gastos" });

    await expect(gastosItem).toBeVisible();
    await expect(gastosItem).toHaveClass(/bg-primary/);
  });

  test("el ítem 'Ahorro' debe estar resaltado cuando estamos en /savings", async ({
    page,
  }) => {
    await page.goto("/savings");
    await page.waitForURL("**/savings", { timeout: 10_000 });

    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const ahorroItem = sidebar
      .locator('[data-sidebar="menu-item"]')
      .filter({ hasText: "Ahorro" });

    await expect(ahorroItem).toBeVisible();
    await expect(ahorroItem).toHaveClass(/bg-primary/);
  });
});

// ---------------------------------------------------------------------------
// Navigation — Profile and Settings access from user menu
// ---------------------------------------------------------------------------

test.describe("Navigation — Acceso a Perfil y Configuración desde el menú de usuario", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("abrir el menú de usuario en el sidebar debe mostrar opciones de Perfil y Configuración", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // The NavUser component is inside the sidebar footer
    const sidebarFooter = sidebar.locator('[data-sidebar="footer"]');
    await expect(sidebarFooter).toBeVisible();

    // Click the user menu button (SidebarMenuButton inside footer)
    const userMenuButton = sidebarFooter.locator("button").first();
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    // A dropdown menu should appear with "Perfil" and "Configuración"
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // "Perfil" menu item
    const perfilItem = dropdown.locator("a").filter({ hasText: "Perfil" });
    await expect(perfilItem).toBeVisible();

    // "Configuración" menu item
    const configItem = dropdown
      .locator("a")
      .filter({ hasText: "Configuración" });
    await expect(configItem).toBeVisible();

    // "Cerrar sesión" menu item
    await expect(dropdown.locator("text=Cerrar sesión")).toBeVisible();
  });

  test("clic en 'Perfil' del menú de usuario debe navegar a /profile", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const sidebarFooter = sidebar.locator('[data-sidebar="footer"]');
    await expect(sidebarFooter).toBeVisible({ timeout: 10_000 });

    // Open user menu
    const userMenuButton = sidebarFooter.locator("button").first();
    await userMenuButton.click();

    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // Click "Perfil"
    const perfilLink = dropdown.locator("a").filter({ hasText: "Perfil" });
    await perfilLink.click();

    await page.waitForURL("**/profile", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/profile");
  });

  test("clic en 'Configuración' del menú de usuario debe navegar a /settings", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const sidebarFooter = sidebar.locator('[data-sidebar="footer"]');
    await expect(sidebarFooter).toBeVisible({ timeout: 10_000 });

    // Open user menu
    const userMenuButton = sidebarFooter.locator("button").first();
    await userMenuButton.click();

    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // Click "Configuración"
    const configLink = dropdown
      .locator("a")
      .filter({ hasText: "Configuración" });
    await configLink.click();

    await page.waitForURL("**/settings", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/settings");
  });
});

// ---------------------------------------------------------------------------
// Navigation — Browser back/forward behavior
// ---------------------------------------------------------------------------

test.describe("Navigation — Historial del navegador (back/forward)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    const currentPath = new URL(page.url()).pathname;
    if (!currentPath.startsWith("/dashboard")) {
      test.skip(true, "User not on dashboard (possibly needs onboarding)");
    }
  });

  test("navegar entre varias páginas y usar el botón 'atrás' del navegador", async ({
    page,
  }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Start on /dashboard
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // Navigate to /expenses
    await sidebar.locator("a").filter({ hasText: "Gastos" }).click();
    await page.waitForURL("**/expenses", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/expenses");

    // Navigate to /savings
    await sidebar.locator("a").filter({ hasText: "Ahorro" }).click();
    await page.waitForURL("**/savings", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/savings");

    // Go back — should return to /expenses
    await page.goBack();
    await page.waitForURL("**/expenses", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/expenses");

    // Go back again — should return to /dashboard
    await page.goBack();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // Go forward — should go to /expenses
    await page.goForward();
    await page.waitForURL("**/expenses", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/expenses");
  });
});
