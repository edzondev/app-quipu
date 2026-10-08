import { describe, expect, it } from "vitest";
import { buildAllocationApplyResult } from "./incomeAllocation";

describe("buildAllocationApplyResult", () => {
	it("fully distributes income without inventing additional savings", () => {
		const result = buildAllocationApplyResult({
			amountCents: 318_237,
			plan: {
				reservations: [{ commitmentId: "c1", amountCents: 250_000 }],
				envelopes: { needs: 40_000, wants: 10_000, savings: 8_000 },
				savingsContributions: [{ amountCents: 5_000, kind: "objective" }],
				leaveUnallocatedCents: 5_237,
			},
		});
		expect(result.totals.reservedCents).toBe(250_000);
		expect(result.totals.additionalContributionCents).toBe(0);
		expect(result.totals.unallocatedCents).toBe(5_237);
		expect(result.distributionApplied).toEqual({
			needs: 40_000,
			wants: 10_000,
			savings: 8_000,
		});
	});

	it("counts only kind=additional as additional savings", () => {
		const result = buildAllocationApplyResult({
			amountCents: 20_000,
			plan: {
				reservations: [],
				envelopes: { needs: 0, wants: 0, savings: 0 },
				savingsContributions: [
					{ amountCents: 12_000, kind: "objective" },
					{ amountCents: 8_000, kind: "additional" },
				],
				leaveUnallocatedCents: 0,
			},
		});
		expect(result.totals.objectiveContributionCents).toBe(12_000);
		expect(result.totals.additionalContributionCents).toBe(8_000);
	});

	it("rejects over-allocation", () => {
		expect(() =>
			buildAllocationApplyResult({
				amountCents: 100,
				plan: {
					reservations: [{ commitmentId: "c1", amountCents: 80 }],
					envelopes: { needs: 30, wants: 0, savings: 0 },
					savingsContributions: [],
					leaveUnallocatedCents: 0,
				},
			}),
		).toThrow(/sumar exactamente/);
	});
});
