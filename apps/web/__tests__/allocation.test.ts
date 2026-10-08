import { describe, expect, it } from "vitest";
import { distributeEnvelope } from "../modules/onboarding/lib/allocation";

describe("distributeEnvelope", () => {
	it("returns unchanged state when value doesn't change", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 50);
		expect(result).toEqual(state);
	});

	it("adding 5 to needs distributes deficit proportionally from wants and savings", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 55);
		expect(result.allocationNeeds).toBe(55);
		expect(result.allocationWants + result.allocationSavings).toBe(45);
		expect(result.allocationWants).toBe(27); // 30 - 3 (60% of 5)
		expect(result.allocationSavings).toBe(18); // 20 - 2 (40% of 5)
	});

	it("setting to 100 zeroes out the other two", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 100);
		expect(result).toEqual({
			allocationNeeds: 100,
			allocationWants: 0,
			allocationSavings: 0,
		});
	});

	it("setting to 0 distributes surplus proportionally to others", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 0);
		expect(result.allocationNeeds).toBe(0);
		expect(result.allocationWants).toBe(60); // 30 + 30 (60% of 50)
		expect(result.allocationSavings).toBe(40); // 20 + 20 (40% of 50)
	});

	it("clamps above 100", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 150);
		expect(result).toEqual({
			allocationNeeds: 100,
			allocationWants: 0,
			allocationSavings: 0,
		});
	});

	it("clamps below 0", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		};
		const result = distributeEnvelope(state, "allocationNeeds", -10);
		expect(result).toEqual({
			allocationNeeds: 0,
			allocationWants: 60,
			allocationSavings: 40,
		});
	});

	it("when one other envelope is zero, distributes fully to the remaining one", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 50,
			allocationSavings: 0,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 60);
		expect(result).toEqual({
			allocationNeeds: 60,
			allocationWants: 40,
			allocationSavings: 0,
		});
	});

	it("when both others are zero, sets others to zero", () => {
		const state = {
			allocationNeeds: 50,
			allocationWants: 50,
			allocationSavings: 0,
		};
		const result = distributeEnvelope(state, "allocationNeeds", 30);
		expect(result).toEqual({
			allocationNeeds: 30,
			allocationWants: 70,
			allocationSavings: 0,
		});
	});

	it("total always equals 100", () => {
		const cases: [number, number, number, number][] = [
			[50, 30, 20, 55],
			[50, 30, 20, 0],
			[50, 30, 20, 100],
			[33, 33, 34, 67],
			[10, 90, 0, 50],
		];
		for (const [needs, wants, savings, change] of cases) {
			const state = {
				allocationNeeds: needs,
				allocationWants: wants,
				allocationSavings: savings,
			};
			const result = distributeEnvelope(state, "allocationNeeds", change);
			const total = result.allocationNeeds + result.allocationWants + result.allocationSavings;
			expect(total).toBe(100);
		}
	});
});
