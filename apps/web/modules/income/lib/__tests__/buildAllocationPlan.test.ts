import { describe, expect, it } from "vitest";
import { buildIncomeAllocationPlan } from "../buildAllocationPlan";

const WEIGHTS = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

describe("buildIncomeAllocationPlan", () => {
	it("reserves debt then splits the remainder", () => {
		const plan = buildIncomeAllocationPlan({
			amountCents: 318_237,
			weights: WEIGHTS,
			reservations: [{ commitmentId: "debt", amountCents: 250_000 }],
			leaveUnallocatedCents: 0,
		});
		expect(plan.reservations[0]?.amountCents).toBe(250_000);
		expect(plan.envelopes.needs + plan.envelopes.wants + plan.envelopes.savings).toBe(68_237);
		expect(plan.leaveUnallocatedCents).toBe(0);
	});

	it("can leave remainder unallocated without inventing savings", () => {
		const plan = buildIncomeAllocationPlan({
			amountCents: 10_000,
			weights: WEIGHTS,
			reservations: [],
			leaveUnallocatedCents: 10_000,
		});
		expect(plan.envelopes).toEqual({ needs: 0, wants: 0, savings: 0 });
		expect(plan.savingsContributions).toEqual([]);
	});

	it("all_to_savings puts remainder into savings envelope only", () => {
		const plan = buildIncomeAllocationPlan({
			amountCents: 100_000,
			weights: WEIGHTS,
			reservations: [{ commitmentId: "debt", amountCents: 20_000 }],
			distributionPolicy: "all_to_savings",
		});
		expect(plan.envelopes).toEqual({ needs: 0, wants: 0, savings: 80_000 });
	});
});
