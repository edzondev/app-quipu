import { describe, expect, it } from "vitest";
import { resolveBreadcrumbs } from "../breadcrumbs";

describe("resolveBreadcrumbs", () => {
	it("hides breadcrumb on dashboard and first-level hubs", () => {
		expect(resolveBreadcrumbs("/dashboard")).toBeNull();
		expect(resolveBreadcrumbs("/savings")).toBeNull();
		expect(resolveBreadcrumbs("/settings")).toBeNull();
	});

	it("resolves static sub-routes", () => {
		expect(resolveBreadcrumbs("/movements")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Movimientos" },
		]);

		expect(resolveBreadcrumbs("/savings/move")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Ahorros", href: "/savings" },
			{ label: "Mover sobrante" },
		]);

		expect(resolveBreadcrumbs("/income/register")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Registrar ingreso" },
		]);
	});

	it("resolves settings sub-routes", () => {
		expect(resolveBreadcrumbs("/settings/account")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Ajustes", href: "/settings" },
			{ label: "Cuenta" },
		]);
	});

	it("resolves move success trail", () => {
		expect(resolveBreadcrumbs("/savings/move/success")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Ahorros", href: "/savings" },
			{ label: "Mover sobrante", href: "/savings/move" },
			{ label: "Guardado" },
		]);
	});

	it("resolves dynamic espacios routes", () => {
		expect(resolveBreadcrumbs("/espacios")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Espacios" },
		]);

		expect(resolveBreadcrumbs("/espacios/abc123")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Espacios", href: "/espacios" },
			{ label: "Espacio" },
		]);

		expect(resolveBreadcrumbs("/espacios/abc123/configuracion")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Espacios", href: "/espacios" },
			{ label: "Espacio", href: "/espacios/abc123" },
			{ label: "Configuración" },
		]);
	});

	it("strips trailing slash", () => {
		expect(resolveBreadcrumbs("/movements/")).toEqual([
			{ label: "Inicio", href: "/dashboard" },
			{ label: "Movimientos" },
		]);
	});
});
