import { describe, expect, it } from "vitest";
import { resolveIncomeAllocation } from "./defaultAllocationPlan";

const profile = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

describe("resolveIncomeAllocation", () => {
	it("returns the explicit plan unchanged, reservations included", () => {
		const allocation = {
			reservations: [{ commitmentId: "rent", amountCents: 40_000 }],
			envelopes: { needs: 30_000, wants: 20_000, savings: 10_000 },
			savingsContributions: [],
			leaveUnallocatedCents: 0,
		};
		expect(
			resolveIncomeAllocation({
				amountCents: 100_000,
				allocation,
				profile: { allocationNeeds: 10, allocationWants: 10, allocationSavings: 80 },
			}),
		).toBe(allocation);
	});

	it("splits a missing plan with the profile percentages", () => {
		expect(
			resolveIncomeAllocation({
				amountCents: 100_000,
				profile,
			}),
		).toEqual({
			reservations: [],
			envelopes: { needs: 50_000, wants: 30_000, savings: 20_000 },
			savingsContributions: [],
			leaveUnallocatedCents: 0,
		});
	});

	it("uses the profile percentages even when they are not 50/30/20", () => {
		expect(
			resolveIncomeAllocation({
				amountCents: 200,
				profile: { allocationNeeds: 60, allocationWants: 25, allocationSavings: 15 },
			}).envelopes,
		).toEqual({ needs: 120, wants: 50, savings: 30 });
	});

	it("sends an extraordinary remainder to savings when that policy is set", () => {
		expect(
			resolveIncomeAllocation({
				amountCents: 12_345,
				profile,
				distributionPolicy: "all_to_savings",
			}).envelopes,
		).toEqual({ needs: 0, wants: 0, savings: 12_345 });
	});
});
