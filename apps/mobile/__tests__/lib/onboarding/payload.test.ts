import { PAYDAYS_BY_FREQUENCY } from "@/shared/lib/onboarding/defaults";
import { buildOnboardingPayload } from "@/shared/lib/onboarding/payload";

describe("buildOnboardingPayload", () => {
	const base = {
		incomeModel: "fixed",
		payFrequency: "biweekly",
		allocationNeeds: 50,
		allocationWants: 30,
		allocationSavings: 20,
	};

	it("fija paydays nominales según frecuencia y completa mercado default", () => {
		const payload = buildOnboardingPayload({
			...base,
			referenceIncomeCents: 350000,
		});
		expect(payload.paydays).toEqual(PAYDAYS_BY_FREQUENCY.biweekly);
		expect(payload.country).toBe("Perú");
		expect(payload.currencyCode).toBe("PEN");
		expect(payload.currencySymbol).toBe("S/");
	});

	it("excluye referenceIncomeCents y paydays custom del wizard", () => {
		const payload = buildOnboardingPayload({ ...base, paydays: [24] });
		expect(payload.paydays).toEqual([15, 30]);
		expect("referenceIncomeCents" in payload).toBe(false);
	});

	it("variable: exige cycleDurationDays, elimina payFrequency/paydays", () => {
		const payload = buildOnboardingPayload({
			incomeModel: "variable",
			cycleDurationDays: 15,
			variableIncomeSources: ["Freelance"],
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		});
		expect(payload.payFrequency).toBeUndefined();
		expect(payload.cycleDurationDays).toBe(15);
		expect(() =>
			buildOnboardingPayload({
				incomeModel: "variable",
				allocationNeeds: 50,
				allocationWants: 30,
				allocationSavings: 20,
			}),
		).toThrow();
	});

	it("mixed: exige payFrequency y mixedFixedAmount", () => {
		const payload = buildOnboardingPayload({
			incomeModel: "mixed",
			payFrequency: "monthly",
			mixedFixedAmount: 200000,
			variableIncomeSources: ["Proyectos"],
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		});
		expect(payload.payFrequency).toBe("monthly");
		expect(payload.mixedFixedAmount).toBe(200000);
	});

	it("rechaza allocations que no suman 100", () => {
		expect(() => buildOnboardingPayload({ ...base, allocationSavings: 19 })).toThrow();
	});

	it("name opcional pasa al payload", () => {
		const payload = buildOnboardingPayload({ ...base, name: "Edzon" });
		expect(payload.name).toBe("Edzon");
	});
});
