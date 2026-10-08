import { describe, expect, it } from "vitest";
import {
	assertAllocationBalances,
	summarizeAllocationPlan,
	validateAllocationPlan,
} from "../incomeAllocation";

describe("shared incomeAllocation", () => {
	it("summarizes plan buckets", () => {
		expect(
			summarizeAllocationPlan({
				reservations: [{ commitmentId: "c1", amountCents: 10 }],
				envelopes: { needs: 20, wants: 30, savings: 40 },
				savingsContributions: [{ amountCents: 5, kind: "additional" }],
				leaveUnallocatedCents: 7,
			}),
		).toEqual({
			reservedCents: 10,
			envelopesCents: 90,
			savingsContributionCents: 5,
			unallocatedCents: 7,
		});
	});

	it("validateAllocationPlan accepts balanced plan", () => {
		const result = validateAllocationPlan(112, {
			reservations: [{ commitmentId: "c1", amountCents: 10 }],
			envelopes: { needs: 20, wants: 30, savings: 40 },
			savingsContributions: [{ amountCents: 5, kind: "additional" }],
			leaveUnallocatedCents: 7,
		});
		expect(result.ok).toBe(true);
	});

	it("assertAllocationBalances is strict equality", () => {
		expect(
			assertAllocationBalances(10, {
				reservedCents: 3,
				envelopesCents: 3,
				savingsContributionCents: 3,
				unallocatedCents: 1,
			}),
		).toEqual({ ok: true });
	});
});
