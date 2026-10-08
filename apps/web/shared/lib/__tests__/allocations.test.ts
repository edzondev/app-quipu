import { describe, expect, it } from "vitest";
import { applyDistributionPolicy, computeAllocations } from "../allocations";

const WEIGHTS = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

describe("computeAllocations", () => {
	it("distributes exactly the input amount", () => {
		const result = computeAllocations(10_000, WEIGHTS);
		expect(result.needs + result.wants + result.savings).toBe(10_000);
	});
});

describe("applyDistributionPolicy", () => {
	it("uses profile weights for profile_default", () => {
		const result = applyDistributionPolicy(10_000, WEIGHTS, "profile_default");
		expect(result).toEqual(computeAllocations(10_000, WEIGHTS));
	});

	it("puts 100% in savings for all_to_savings", () => {
		expect(applyDistributionPolicy(12_345, WEIGHTS, "all_to_savings")).toEqual({
			needs: 0,
			wants: 0,
			savings: 12_345,
		});
	});
});
