import { ALLOCATION_DEFAULTS, distributeEnvelope } from "@/shared/lib/onboarding/allocation";

describe("distributeEnvelope", () => {
	it("distribuye proporcionalmente entre los otros envelopes", () => {
		const result = distributeEnvelope(
			{ allocationNeeds: 50, allocationWants: 30, allocationSavings: 20 },
			"allocationNeeds",
			60,
		);
		expect(result.allocationNeeds).toBe(60);
		expect(result.allocationWants + result.allocationSavings).toBe(40);
		expect(result.allocationWants).toBeLessThanOrEqual(30);
		expect(result.allocationSavings).toBeLessThanOrEqual(20);
	});

	it("clamp a 100: los demás quedan en 0", () => {
		const result = distributeEnvelope(ALLOCATION_DEFAULTS, "allocationWants", 100);
		expect(result.allocationWants).toBe(100);
		expect(result.allocationNeeds).toBe(0);
		expect(result.allocationSavings).toBe(0);
	});

	it("clamp a 0: redistribuye el valor liberado entre los demás", () => {
		const result = distributeEnvelope(ALLOCATION_DEFAULTS, "allocationNeeds", -5);
		expect(result.allocationNeeds).toBe(0);
		expect(result.allocationWants + result.allocationSavings).toBe(100);
		expect(result.allocationWants).toBeGreaterThanOrEqual(0);
		expect(result.allocationSavings).toBeGreaterThanOrEqual(0);
	});

	it("mismo valor es no-op (misma referencia)", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		expect(distributeEnvelope(state, "allocationNeeds", 50)).toBe(state);
	});

	it("redistribuye aunque un envelope esté en 0", () => {
		const result = distributeEnvelope(
			{ allocationNeeds: 50, allocationWants: 0, allocationSavings: 50 },
			"allocationNeeds",
			60,
		);
		expect(result.allocationNeeds).toBe(60);
		expect(result.allocationWants).toBe(0);
		expect(result.allocationSavings).toBe(40);
	});

	it("nunca produce valores negativos", () => {
		const result = distributeEnvelope(
			{ allocationNeeds: 90, allocationWants: 5, allocationSavings: 5 },
			"allocationNeeds",
			100,
		);
		expect(result.allocationWants).toBeGreaterThanOrEqual(0);
		expect(result.allocationSavings).toBeGreaterThanOrEqual(0);
	});
});
