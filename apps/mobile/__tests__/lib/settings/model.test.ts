import { settingsOverview } from "@/__fixtures__/settings-overview";
import { firstName, presentSettings, profileInitial } from "@/shared/lib/settings/model";

describe("presentSettings", () => {
	it("arma la cuenta y las llaves", () => {
		const free = settingsOverview();
		expect(presentSettings(free)).toMatchObject({
			initial: "E",
			name: "Edzon Perez",
			meta: "edzon@correo.com · Perú",
			passkeysLabel: "2 llaves",
			hasPassword: true,
			deleteBlockedBySubscription: false,
		});
		expect(presentSettings(settingsOverview({ tier: "premium" }))).toMatchObject({
			deleteBlockedBySubscription: false,
		});
		expect(presentSettings(settingsOverview({ hasPassword: false })).hasPassword).toBe(false);
		expect(presentSettings(settingsOverview({ passkeyCount: 1 })).passkeysLabel).toBe("1 llave");
		expect(
			presentSettings(settingsOverview({ passkeysSource: "unavailable", passkeyCount: 2 }))
				.passkeysLabel,
		).toBeNull();
	});

	it("pasa deleteBlockedBySubscription del overview aunque el status se vea free", () => {
		const overview = settingsOverview();
		expect(overview.billing.subscriptionStatus).toBe("free");
		expect(overview.billing.deleteBlockedBySubscription).toBe(false);
		expect(presentSettings(overview).deleteBlockedBySubscription).toBe(false);
		expect(
			presentSettings({
				...overview,
				billing: {
					...overview.billing,
					subscriptionStatus: "free",
					cancelAtPeriodEnd: false,
					deleteBlockedBySubscription: true,
				},
			}).deleteBlockedBySubscription,
		).toBe(true);
	});

	it("con email nulo muestra solo el país y no el código crudo", () => {
		expect(presentSettings(settingsOverview({ email: null })).meta).toBe("Perú");
		expect(profileInitial("  ana")).toBe("A");
	});
});

describe("firstName", () => {
	it("se queda con el primer nombre aunque el usuario escriba nombre y apellidos", () => {
		expect(firstName("Edzon Alberto Quispe Huamán")).toBe("Edzon");
		expect(firstName("  Ana   María ")).toBe("Ana");
	});

	it("conserva un nombre simple y no inventa nada si está vacío", () => {
		expect(firstName("Ana")).toBe("Ana");
		expect(firstName("")).toBe("");
		expect(firstName("   ")).toBe("");
	});
});
