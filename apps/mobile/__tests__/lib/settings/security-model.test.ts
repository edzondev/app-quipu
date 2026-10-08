import {
	PASSKEY_CREATED_AT,
	passkeyList,
	SECURITY_NOW,
	securityPasskey,
	securitySession,
	sessionList,
} from "@/__fixtures__/security";
import {
	deviceLabelFromUserAgent,
	limaActivityLabel,
	presentSecurity,
	sessionActivityCopy,
} from "@/shared/lib/settings/security-model";

const IPHONE =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

describe("security-model", () => {
	it("deriva el dispositivo del userAgent y cae en un genérico", () => {
		expect(deviceLabelFromUserAgent(IPHONE)).toBe("iPhone");
		expect(deviceLabelFromUserAgent(securitySession().userAgent)).toBe("Chrome");
		expect(deviceLabelFromUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("Android");
		expect(deviceLabelFromUserAgent(null)).toBe("Dispositivo");
		expect(deviceLabelFromUserAgent("   ")).toBe("Dispositivo");
		expect(deviceLabelFromUserAgent("okhttp/4.12.0")).toBe("Android");
	});

	it("formatea fechas de Lima", () => {
		expect(limaActivityLabel(SECURITY_NOW, SECURITY_NOW)).toBe("HOY");
		expect(limaActivityLabel(Date.UTC(2026, 7, 15, 17, 0, 0), SECURITY_NOW)).toBe("AYER");
		expect(limaActivityLabel(Date.UTC(2026, 7, 13, 17, 0, 0), SECURITY_NOW)).toBe("HACE 3 DÍAS");
		expect(limaActivityLabel(PASSKEY_CREATED_AT, SECURITY_NOW)).toBe("3 JUN");
		expect(sessionActivityCopy(true, SECURITY_NOW, SECURITY_NOW)).toBe("ESTE DISPOSITIVO · HOY");
	});

	it("arma la pantalla sin ciudad, sin último uso y sin el userAgent crudo", () => {
		const model = presentSecurity({
			security: {
				...passkeyList({
					passkeys: [
						securityPasskey({ label: null, name: "nombre-interno" }),
						securityPasskey({ id: "pk-mac", label: "MacBook", createdAt: null }),
					],
				}),
				hasPassword: true,
				emailVerified: false,
			},
			sessions: sessionList(),
			now: SECURITY_NOW,
		});
		expect(model.passkeys).toEqual([
			{ id: "pk-phone", name: "Passkey", createdLabel: "CREADA 3 JUN" },
			{ id: "pk-mac", name: "MacBook", createdLabel: null },
		]);
		expect(model.sessions?.[0]).toMatchObject({
			device: "iPhone",
			activity: "ESTE DISPOSITIVO · HOY",
			isCurrent: true,
		});
		expect(model.sessions?.[1]).toMatchObject({
			device: "Chrome",
			activity: "HACE 3 DÍAS",
			isCurrent: false,
		});
		expect(model.passwordLabel).toBe("Definida");
		expect(model.emailLabel).toBe("Sin verificar");
		const rendered = JSON.stringify({
			passkeys: model.passkeys?.map((row) => ({ name: row.name, createdLabel: row.createdLabel })),
			sessions: model.sessions?.map((row) => ({ device: row.device, activity: row.activity })),
		});
		expect(rendered).not.toContain("Lima");
		expect(rendered).not.toContain("Último uso");
		expect(rendered).not.toContain("SecretAgentToken");
		expect(rendered).not.toContain("nombre-interno");
	});

	it("oculta passkeys y sesiones cuando la API no está lista", () => {
		const model = presentSecurity({
			security: {
				...passkeyList({ source: "unavailable", passkeys: [securityPasskey()] }),
				hasPassword: false,
				emailVerified: true,
			},
			sessions: sessionList({ apiReady: false, sessions: [] }),
			now: SECURITY_NOW,
		});
		expect(model.passkeys).toBeNull();
		expect(model.sessions).toBeNull();
		expect(model.passwordLabel).toBe("Sin definir");
		expect(model.emailLabel).toBe("Verificado");
		expect(model.emailVerified).toBe(true);
	});
});
