import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/env.client", () => ({
	clientEnv: {
		NEXT_PUBLIC_APP_URL: "https://quipu-finance.app",
		NEXT_PUBLIC_CONVEX_URL: "https://convex.test",
		NEXT_PUBLIC_CONVEX_SITE_URL: "https://convex-site.test",
	},
}));

import PrivacidadPage, { ACCOUNT_DELETION_EMAIL } from "./page";

afterEach(() => {
	cleanup();
});

describe("PrivacidadPage", () => {
	it("renderiza la sección con id eliminar-cuenta para Play Console", () => {
		render(<PrivacidadPage />);

		const section = document.getElementById("eliminar-cuenta");
		expect(section).not.toBeNull();
		expect(section?.tagName).toBe("SECTION");
		expect(section?.querySelector("h2")?.textContent).toBe("Eliminar cuenta");
		expect(screen.getByRole("heading", { level: 2, name: "Eliminar cuenta" })).toBeTruthy();
		expect(document.querySelectorAll("#eliminar-cuenta")).toHaveLength(1);
	});

	it("explica cómo borrar la cuenta, qué se elimina, el plazo y la suscripción", () => {
		render(<PrivacidadPage />);

		const section = document.getElementById("eliminar-cuenta");
		expect(section).not.toBeNull();
		const text = section?.textContent ?? "";

		expect(ACCOUNT_DELETION_EMAIL).toBe("soportequipu@gmail.com");
		expect(text).toContain("Ajustes > Eliminar cuenta");
		expect(text).not.toContain("[CORREO PENDIENTE]");
		expect(text).toContain(ACCOUNT_DELETION_EMAIL);
		const mail = screen.getByRole("link", { name: ACCOUNT_DELETION_EMAIL });
		expect(mail.getAttribute("href")).toBe(`mailto:${ACCOUNT_DELETION_EMAIL}`);
		expect(text).toContain(
			"Se eliminan tu perfil, ciclos, sobres, movimientos/gastos, compromisos, metas y sesiones.",
		);
		expect(text).toMatch(/30 días/);
		expect(text).toMatch(/sistemas activos/i);
		expect(text).toMatch(/respaldos/i);
		expect(text).toContain(
			"Al eliminar tu cuenta cancelamos tu suscripción activa y ya no se te cobrará más.",
		);
		expect(text).not.toMatch(/no cancela automáticamente/i);
		expect(text).not.toMatch(/Google Play/);
		expect(text).not.toMatch(/App Store/);
	});

	it("fija la conservación de respaldos en 30 días", () => {
		render(<PrivacidadPage />);

		expect(screen.queryByText(/ciclos normales de nuestros proveedores/i)).toBeNull();
		expect(screen.getAllByText(/plazo máximo de 30 días/i).length).toBeGreaterThanOrEqual(1);
	});
});
