import { describe, expect, it } from "vitest";
import {
	buildCycleScheduleCopy,
	incomeModelLabel,
	payFrequencyLabel,
	planDisplay,
	resolveCycleAlertsEnabled,
	resolveDailySummaryEnabled,
} from "./settingsCopy";

describe("incomeModelLabel", () => {
	it("maps onboarding display labels", () => {
		expect(incomeModelLabel("fixed")).toBe("Dependiente");
		expect(incomeModelLabel("variable")).toBe("Independiente");
		expect(incomeModelLabel("mixed")).toBe("Mixto");
	});
});

describe("payFrequencyLabel", () => {
	it("includes weekly and variable cadences", () => {
		expect(payFrequencyLabel("monthly")).toBe("Mensual");
		expect(payFrequencyLabel("biweekly")).toBe("Quincenal");
		expect(payFrequencyLabel("weekly")).toBe("Semanal");
		expect(payFrequencyLabel("variable")).toBe("Variable");
	});
});

describe("planDisplay", () => {
	it("stubs premium copy for USD market", () => {
		expect(planDisplay("premium", "USD").label).toBe("Quipu Plus");
		expect(planDisplay("premium", "USD").priceCopy).toBe("$4.99/mes");
	});

	it("describes free tier with market price", () => {
		expect(planDisplay("free", "PEN").priceCopy).toBe("Automatización desde S/ 14.90/mes");
		expect(planDisplay("free").statusCopy).toBe("Plan gratuito");
	});
});

describe("preference defaults", () => {
	it("defaults toggles to true when unset", () => {
		expect(resolveDailySummaryEnabled({})).toBe(true);
		expect(resolveCycleAlertsEnabled({})).toBe(true);
	});

	it("respects stored values", () => {
		expect(resolveDailySummaryEnabled({ dailySummaryEnabled: false })).toBe(false);
	});
});

describe("buildCycleScheduleCopy", () => {
	it("formats variable income cycles", () => {
		expect(
			buildCycleScheduleCopy({
				incomeModel: "variable",
				cycleDurationDays: 30,
			}),
		).toEqual({
			typeLabel: "Independiente",
			scheduleCopy: "Variable · 30 días por ciclo",
			cycleDays: 30,
		});
	});

	it("formats biweekly paydays", () => {
		expect(
			buildCycleScheduleCopy({
				incomeModel: "fixed",
				payFrequency: "biweekly",
				paydays: [1, 15],
			}),
		).toMatchObject({
			scheduleCopy: "Quincenal · día 1 y día 15",
			cycleDays: 15,
		});
	});
});
