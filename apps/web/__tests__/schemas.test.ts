import { describe, expect, it } from "vitest";
import { finalPayloadSchema } from "../modules/onboarding/schemas";

const BASE = {
	incomeModel: "fixed",
	country: "Perú",
	currencyCode: "PEN",
	currencySymbol: "S/",
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

const FIXED = {
	...BASE,
	payFrequency: "monthly" as const,
	paydays: [30],
};

const VARIABLE = {
	...BASE,
	incomeModel: "variable" as const,
	cycleDurationDays: 30 as const,
};

const MIXED = {
	...BASE,
	incomeModel: "mixed" as const,
	payFrequency: "monthly" as const,
	paydays: [15],
	mixedFixedAmount: 350_000,
	variableIncomeSources: ["proyectos"],
};

describe("finalPayloadSchema", () => {
	it("accepts fixed with required schedule fields", () => {
		expect(finalPayloadSchema.safeParse(FIXED).success).toBe(true);
	});

	it("rejects fixed without payFrequency/paydays", () => {
		expect(finalPayloadSchema.safeParse(BASE).success).toBe(false);
		expect(finalPayloadSchema.safeParse({ ...BASE, payFrequency: "monthly" }).success).toBe(false);
	});

	it("rejects null for payFrequency (Zod optional != nullable)", () => {
		const result = finalPayloadSchema.safeParse({
			...FIXED,
			payFrequency: null,
		});
		expect(result.success).toBe(false);
	});

	it("rejects null for paydays", () => {
		expect(finalPayloadSchema.safeParse({ ...FIXED, paydays: null }).success).toBe(false);
	});

	it("rejects null for cycleDurationDays", () => {
		expect(finalPayloadSchema.safeParse({ ...VARIABLE, cycleDurationDays: null }).success).toBe(
			false,
		);
	});

	it("rejects null for mixedFixedAmount", () => {
		expect(finalPayloadSchema.safeParse({ ...MIXED, mixedFixedAmount: null }).success).toBe(false);
	});

	it("rejects null for variableIncomeSources", () => {
		expect(finalPayloadSchema.safeParse({ ...MIXED, variableIncomeSources: null }).success).toBe(
			false,
		);
	});

	it("rejects payFrequency outside enum", () => {
		expect(finalPayloadSchema.safeParse({ ...FIXED, payFrequency: "weekly" }).success).toBe(false);
	});

	it("rejects paydays with values out of 1-31", () => {
		expect(finalPayloadSchema.safeParse({ ...FIXED, paydays: [32] }).success).toBe(false);
		expect(finalPayloadSchema.safeParse({ ...FIXED, paydays: [0] }).success).toBe(false);
	});

	it("rejects cycleDurationDays other than 15 or 30", () => {
		expect(finalPayloadSchema.safeParse({ ...VARIABLE, cycleDurationDays: 7 }).success).toBe(false);
		expect(finalPayloadSchema.safeParse({ ...VARIABLE, cycleDurationDays: 45 }).success).toBe(
			false,
		);
	});

	it("accepts variable with cycleDurationDays of 15 or 30", () => {
		expect(finalPayloadSchema.safeParse({ ...VARIABLE, cycleDurationDays: 15 }).success).toBe(true);
		expect(finalPayloadSchema.safeParse({ ...VARIABLE, cycleDurationDays: 30 }).success).toBe(true);
	});

	it("rejects variable without cycleDurationDays", () => {
		expect(
			finalPayloadSchema.safeParse({
				...BASE,
				incomeModel: "variable",
			}).success,
		).toBe(false);
	});

	it("rejects variable with payFrequency", () => {
		expect(
			finalPayloadSchema.safeParse({
				...VARIABLE,
				payFrequency: "monthly",
			}).success,
		).toBe(false);
	});

	it("accepts mixed with schedule + optional extras", () => {
		expect(finalPayloadSchema.safeParse(MIXED).success).toBe(true);
		expect(
			finalPayloadSchema.safeParse({
				...BASE,
				incomeModel: "mixed",
				payFrequency: "monthly",
				paydays: [1],
			}).success,
		).toBe(true);
	});

	it("rejects mixed without paydays", () => {
		expect(
			finalPayloadSchema.safeParse({
				...BASE,
				incomeModel: "mixed",
				payFrequency: "monthly",
			}).success,
		).toBe(false);
	});

	it("rejects mixedFixedAmount negative", () => {
		expect(finalPayloadSchema.safeParse({ ...MIXED, mixedFixedAmount: -1 }).success).toBe(false);
	});

	it("accepts mixedFixedAmount as integer cents", () => {
		expect(finalPayloadSchema.safeParse({ ...MIXED, mixedFixedAmount: 350000 }).success).toBe(true);
	});

	it("accepts variableIncomeSources array", () => {
		expect(
			finalPayloadSchema.safeParse({
				...MIXED,
				variableIncomeSources: ["proyectos", "ventas"],
			}).success,
		).toBe(true);
	});

	it("rejects variableIncomeSources with empty strings", () => {
		expect(finalPayloadSchema.safeParse({ ...MIXED, variableIncomeSources: [""] }).success).toBe(
			false,
		);
	});

	it("rejects variableIncomeSources with names over 30 chars", () => {
		expect(
			finalPayloadSchema.safeParse({
				...MIXED,
				variableIncomeSources: ["a".repeat(31)],
			}).success,
		).toBe(false);
	});

	it("rejects allocations that don't sum to 100", () => {
		expect(
			finalPayloadSchema.safeParse({
				...FIXED,
				allocationNeeds: 60,
				allocationWants: 30,
				allocationSavings: 20,
			}).success,
		).toBe(false);
		expect(
			finalPayloadSchema.safeParse({
				...FIXED,
				allocationNeeds: 50,
				allocationWants: 40,
				allocationSavings: 20,
			}).success,
		).toBe(false);
	});

	it("accepts non-default allocations that sum to 100", () => {
		expect(
			finalPayloadSchema.safeParse({
				...FIXED,
				allocationNeeds: 60,
				allocationWants: 20,
				allocationSavings: 20,
			}).success,
		).toBe(true);
	});
});
