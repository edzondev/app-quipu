import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { evaluateCycleCompliance } from "./budgetMath";
import {
	assertSurplusNotCarriedOver,
	computeCycleCarryover,
	envelopeWithCarry,
	savingsContributionExcludingCarry,
	surplusWasCarriedOver,
} from "./cycleCarryover";

const MOVED_AT = Date.UTC(2026, 8, 2);

function carry(input: {
	needs: number;
	wants: number;
	savings: number;
	extraordinarySavings?: number;
	movedAt?: number;
	carriedOverToCycleId?: string;
	rows?: Parameters<typeof computeCycleCarryover>[0]["surplusContributions"];
}) {
	return computeCycleCarryover({
		envelopes: [
			{ type: "needs", remainingAmount: input.needs },
			{ type: "wants", remainingAmount: input.wants },
			{ type: "savings", remainingAmount: input.savings },
		],
		closeSurplusMovedAt: input.movedAt,
		carriedOverToCycleId: input.carriedOverToCycleId,
		surplusContributions: input.rows ?? [],
		incomeEvents:
			input.extraordinarySavings === undefined
				? []
				: [
						{
							incomeKind: "extraordinary",
							distributionApplied: { needs: 0, wants: 0, savings: input.extraordinarySavings },
						},
					],
	});
}

describe("computeCycleCarryover", () => {
	it("carries each leftover, negatives included, with extraordinary inside savings", () => {
		expect(
			carry({ needs: 25_000, wants: 4_000, savings: 10_000, extraordinarySavings: 4_000 }),
		).toEqual({
			needs: 25_000,
			wants: 4_000,
			savings: 10_000,
			extraordinary: 4_000,
		});
		expect(carry({ needs: -5_000, wants: -200, savings: -100 })).toEqual({
			needs: -5_000,
			wants: -200,
			savings: -100,
			extraordinary: 0,
		});
	});

	it("subtracts the fund move and ignores rows from another moment or kind", () => {
		const row = (
			fromEnvelope: "needs" | "wants" | "extraordinary",
			amount: number,
			createdAt: number,
			contributionKind: "additional" | "objective",
		) => ({ fromEnvelope, amount, createdAt, contributionKind });
		expect(
			carry({
				needs: 1_100,
				wants: 2_200,
				savings: 9_000,
				extraordinarySavings: 6_000,
				movedAt: MOVED_AT,
				rows: [
					row("needs", 1_100, MOVED_AT, "additional"),
					row("wants", 2_200, MOVED_AT, "additional"),
					row("extraordinary", 4_400, MOVED_AT, "additional"),
					row("needs", 99_000, MOVED_AT + 1, "additional"),
					row("wants", 77_000, MOVED_AT, "objective"),
				],
			}),
		).toEqual({ needs: 0, wants: 0, savings: 4_600, extraordinary: 1_600 });
	});

	it("returns zeros once carriedOverToCycleId is set", () => {
		expect(
			carry({
				needs: 25_000,
				wants: 4_000,
				savings: 10_000,
				extraordinarySavings: 4_000,
				carriedOverToCycleId: "cycle-next",
			}),
		).toEqual({ needs: 0, wants: 0, savings: 0, extraordinary: 0 });
	});
});

describe("envelope and savings contribution", () => {
	it("opens the envelope with distribution plus carry", () => {
		expect(envelopeWithCarry(10_000, -4_000)).toEqual({
			allocatedAmount: 6_000,
			remainingAmount: 6_000,
			carriedOverCents: -4_000,
		});
	});

	it("excludes savings carryover from this cycle's contribution", () => {
		expect(
			savingsContributionExcludingCarry({ allocatedAmount: 8_000, carriedOverCents: 3_000 }),
		).toBe(5_000);
		expect(
			savingsContributionExcludingCarry({ allocatedAmount: 5_000, carriedOverCents: -2_000 }),
		).toBe(7_000);
		expect(savingsContributionExcludingCarry(null)).toBe(0);
	});
});

describe("assertSurplusNotCarriedOver", () => {
	it("rejects with ALREADY_CARRIED_OVER", () => {
		expect(surplusWasCarriedOver("cycle-next")).toBe(true);
		expect(surplusWasCarriedOver(undefined)).toBe(false);
		expect(() => assertSurplusNotCarriedOver(undefined)).not.toThrow();
		expect(() => assertSurplusNotCarriedOver("cycle-next")).toThrow(ConvexError);
		try {
			assertSurplusNotCarriedOver("cycle-next");
		} catch (error) {
			if (!(error instanceof ConvexError)) throw error;
			expect(error.data).toMatchObject({
				code: "ALREADY_CARRIED_OVER",
				data: { field: "closedCycleId" },
			});
		}
	});
});

describe("evaluateCycleCompliance with carryover", () => {
	it("does not fail on day 1 when negative carry exceeds this cycle's income", () => {
		const opened = (
			type: "needs" | "wants" | "savings",
			distribution: number,
			carried: number,
		) => ({
			type,
			...envelopeWithCarry(distribution, carried),
		});
		expect(
			evaluateCycleCompliance([
				opened("needs", 1_000, -5_000),
				opened("wants", 600, -100),
				opened("savings", 400, -50),
			]),
		).toBe("compliant");
		expect(
			evaluateCycleCompliance([
				{
					type: "needs",
					allocatedAmount: 9_000,
					remainingAmount: -2_000,
					carriedOverCents: -1_000,
				},
			]),
		).toBe("failed");
	});
});
