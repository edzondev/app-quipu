import { describe, expect, it } from "vitest";
import { computeAllocations, isValidPaydays, suggestRescueTransfer } from "./budgetMath";

describe("budgetMath smoke", () => {
	it("computeAllocations distributes exactly the input amount", () => {
		const result = computeAllocations(10000, {
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		});
		const sum = result.needs + result.wants + result.savings;
		expect(sum).toBe(10000);
	});
});

describe("suggestRescueTransfer", () => {
	it("returns transfer 0 and projectedDeficit 0 when wants is non-negative", () => {
		const r = suggestRescueTransfer(5000, 1000);
		expect(r).toEqual({ transfer: 0, projectedDeficit: 0 });
	});

	it("suggests transferring the smaller of deficit and savings", () => {
		const r = suggestRescueTransfer(1000, -500);
		expect(r).toEqual({ transfer: 500, projectedDeficit: 500 });
	});

	it("caps transfer at available savings when deficit exceeds savings", () => {
		const r = suggestRescueTransfer(300, -1000);
		expect(r).toEqual({ transfer: 300, projectedDeficit: 1000 });
	});
});

describe("isValidPaydays (4 frequencies)", () => {
	it("monthly: acepta 1 día", () => {
		expect(isValidPaydays("monthly", [15])).toBe(true);
	});

	it("monthly: rechaza 0 días", () => {
		expect(isValidPaydays("monthly", [])).toBe(false);
	});

	it("biweekly: acepta 2 días", () => {
		expect(isValidPaydays("biweekly", [1, 15])).toBe(true);
	});

	it("biweekly: rechaza 1 solo día", () => {
		expect(isValidPaydays("biweekly", [15])).toBe(false);
	});

	it("weekly: acepta 1 día", () => {
		expect(isValidPaydays("weekly", [15])).toBe(true);
	});

	it("weekly: rechaza 0 días", () => {
		expect(isValidPaydays("weekly", [])).toBe(false);
	});

	it("variable: acepta array vacío", () => {
		expect(isValidPaydays("variable", [])).toBe(true);
	});

	it("rechaza día fuera de 1-31", () => {
		expect(isValidPaydays("monthly", [0])).toBe(false);
		expect(isValidPaydays("monthly", [32])).toBe(false);
	});

	it("rechaza día no entero", () => {
		expect(isValidPaydays("monthly", [15.5])).toBe(false);
	});
});
