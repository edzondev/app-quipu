import { settingsOverview } from "@/__fixtures__/settings-overview";
import {
	firstName,
	presentSettings,
	profileInitial,
	repartoLabel,
} from "@/shared/lib/settings/model";

describe("presentSettings", () => {
	it("arma reparto, plan y llaves", () => {
		const free = settingsOverview();
		expect(repartoLabel(free)).toBe("50 / 30 / 20");
		expect(presentSettings(free)).toMatchObject({
			initial: "E",
			name: "Edzon Perez",
			meta: "edzon@correo.com · Perú",
			passkeysLabel: "2 llaves",
			planLabel: "Gratis",
			repartoLabel: "50 / 30 / 20",
			scheduleCopy: "Mensual · día 1",
		});
		expect(presentSettings(settingsOverview({ tier: "premium" })).planLabel).toBe("Plus");
		expect(presentSettings(settingsOverview({ passkeyCount: 1 })).passkeysLabel).toBe("1 llave");
		expect(
			presentSettings(settingsOverview({ passkeysSource: "unavailable", passkeyCount: 2 }))
				.passkeysLabel,
		).toBeNull();
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
