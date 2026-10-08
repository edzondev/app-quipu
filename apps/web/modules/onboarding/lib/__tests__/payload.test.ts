import { describe, expect, it } from "vitest";
import { ONBOARDING_DEFAULTS } from "../../constants";
import type { OnboardingState } from "../../types";
import { buildOnboardingPayload } from "../payload";

const ALLOCATIONS = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
} as const;

/** Estado típico tras completar el wizard como independiente (variable). */
function independentWizardState(overrides: Partial<OnboardingState> = {}): OnboardingState {
	return {
		...ONBOARDING_DEFAULTS,
		incomeModel: "variable",
		// El wizard deja null/undefined — nunca monthly/biweekly.
		payFrequency: null,
		paydays: [],
		cycleDurationDays: 30,
		...ALLOCATIONS,
		...overrides,
	};
}

/** Estado típico tras completar el wizard con ingresos mixtos. */
function mixedWizardState(overrides: Partial<OnboardingState> = {}): OnboardingState {
	return {
		...ONBOARDING_DEFAULTS,
		incomeModel: "mixed",
		payFrequency: "monthly",
		paydays: [15],
		mixedFixedAmount: 350_000,
		variableIncomeSources: ["proyectos", "ventas"],
		...ALLOCATIONS,
		...overrides,
	};
}

describe("buildOnboardingPayload — mercado", () => {
	it("normaliza España → EUR desde marketId", () => {
		const payload = buildOnboardingPayload(independentWizardState({ marketId: "es" }));
		expect(payload).toMatchObject({
			country: "España",
			currencyCode: "EUR",
			currencySymbol: "€",
		});
	});

	it("normaliza Estados Unidos → USD desde marketId", () => {
		const payload = buildOnboardingPayload(independentWizardState({ marketId: "us" }));
		expect(payload).toMatchObject({
			country: "Estados Unidos",
			currencyCode: "USD",
			currencySymbol: "$",
		});
	});

	it("acepta currencyCode EUR aunque country venga residual", () => {
		const payload = buildOnboardingPayload(
			independentWizardState({
				marketId: "es",
				country: "Perú",
				currencyCode: "EUR",
				currencySymbol: "S/",
			}),
		);
		expect(payload.currencyCode).toBe("EUR");
		expect(payload.currencySymbol).toBe("€");
		expect(payload.country).toBe("España");
	});
});

describe("buildOnboardingPayload — independiente (variable)", () => {
	it("acepta el estado real del wizard sin payFrequency (regresión QUIPU-APP-1)", () => {
		const payload = buildOnboardingPayload(independentWizardState());

		expect(payload.incomeModel).toBe("variable");
		expect(payload.cycleDurationDays).toBe(30);
		expect(payload.payFrequency).toBeUndefined();
		expect(payload.paydays).toBeUndefined();
		expect(payload).toMatchObject({
			country: "Perú",
			currencyCode: "PEN",
			currencySymbol: "S/",
			...ALLOCATIONS,
		});
	});

	it("acepta ciclo de 15 días", () => {
		const payload = buildOnboardingPayload(independentWizardState({ cycleDurationDays: 15 }));
		expect(payload.cycleDurationDays).toBe(15);
		expect(payload.payFrequency).toBeUndefined();
	});

	it("omite payFrequency aunque venga residual de un paso anterior", () => {
		const payload = buildOnboardingPayload(
			independentWizardState({
				// Simula switch fixed→variable donde quedó un valor viejo en memoria.
				payFrequency: "monthly" as OnboardingState["payFrequency"],
				paydays: [30],
			}),
		);
		expect(payload.payFrequency).toBeUndefined();
		expect(payload.paydays).toBeUndefined();
	});

	it("falla si falta cycleDurationDays", () => {
		expect(() =>
			buildOnboardingPayload(independentWizardState({ cycleDurationDays: undefined })),
		).toThrow();
	});
});

describe("buildOnboardingPayload — ingresos mixtos", () => {
	it("acepta parte fija + fuentes variables", () => {
		const payload = buildOnboardingPayload(mixedWizardState());

		expect(payload).toMatchObject({
			incomeModel: "mixed",
			payFrequency: "monthly",
			paydays: [15],
			mixedFixedAmount: 350_000,
			variableIncomeSources: ["proyectos", "ventas"],
			...ALLOCATIONS,
		});
	});

	it("acepta mixto mínimo (día default del paso 1, sin monto ni fuentes)", () => {
		const payload = buildOnboardingPayload(
			mixedWizardState({
				paydays: [1],
				mixedFixedAmount: undefined,
				variableIncomeSources: [],
			}),
		);

		expect(payload.incomeModel).toBe("mixed");
		expect(payload.payFrequency).toBe("monthly");
		expect(payload.paydays).toEqual([1]);
		expect(payload.mixedFixedAmount).toBeUndefined();
		expect(payload.variableIncomeSources).toBeUndefined();
	});

	it("acepta día de pago 30 (pills del paso 2)", () => {
		const payload = buildOnboardingPayload(mixedWizardState({ paydays: [30] }));
		expect(payload.paydays).toEqual([30]);
	});

	it("falla si mixto no tiene payFrequency", () => {
		expect(() => buildOnboardingPayload(mixedWizardState({ payFrequency: null }))).toThrow();
	});

	it("falla si mixto no tiene paydays", () => {
		expect(() => buildOnboardingPayload(mixedWizardState({ paydays: [] }))).toThrow();
	});
});

describe("buildOnboardingPayload — dependiente (fixed)", () => {
	it("acepta mensual con un payday", () => {
		const payload = buildOnboardingPayload({
			...ONBOARDING_DEFAULTS,
			incomeModel: "fixed",
			payFrequency: "monthly",
			paydays: [30],
			...ALLOCATIONS,
		});
		expect(payload).toMatchObject({
			incomeModel: "fixed",
			payFrequency: "monthly",
			paydays: [30],
		});
		expect(payload.cycleDurationDays).toBeUndefined();
	});

	it("acepta quincenal con dos paydays", () => {
		const payload = buildOnboardingPayload({
			...ONBOARDING_DEFAULTS,
			incomeModel: "fixed",
			payFrequency: "biweekly",
			paydays: [15, 30],
			...ALLOCATIONS,
		});
		expect(payload.payFrequency).toBe("biweekly");
		expect(payload.paydays).toEqual([15, 30]);
	});
});
