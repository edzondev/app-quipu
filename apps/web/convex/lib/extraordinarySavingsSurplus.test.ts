import { describe, expect, it } from "vitest";
import {
	balancesAfterClosedCycleSurplusMove,
	computeAvailableExtraordinarySavingsForMove,
	computeExtraordinarySavingsPoolCents,
	sumExtraordinarySavingsAllocated,
	sumMovedFromExtraordinarySurplus,
} from "./extraordinarySavingsSurplus";

describe("sumExtraordinarySavingsAllocated", () => {
	it("sums savings only from extraordinary income events", () => {
		expect(
			sumExtraordinarySavingsAllocated([
				{
					incomeKind: "extraordinary",
					distributionApplied: { savings: 500_00 },
				},
				{
					incomeKind: "habitual",
					distributionApplied: { savings: 200_00 },
				},
				{
					incomeKind: "extraordinary",
					distributionApplied: { savings: 150_00 },
				},
			]),
		).toBe(650_00);
	});
});

describe("sumMovedFromExtraordinarySurplus", () => {
	it("sums only surplus rows from extraordinary source", () => {
		expect(
			sumMovedFromExtraordinarySurplus([
				{ fromEnvelope: "extraordinary", amount: 100_00 },
				{ fromEnvelope: "wants", amount: 50_00 },
				{ fromEnvelope: "extraordinary", amount: 25_00 },
			]),
		).toBe(125_00);
	});
});

describe("computeExtraordinarySavingsPoolCents", () => {
	it("returns allocated minus moved, floored at zero", () => {
		expect(
			computeExtraordinarySavingsPoolCents(
				[
					{
						incomeKind: "extraordinary",
						distributionApplied: { savings: 400_00 },
					},
				],
				[{ fromEnvelope: "extraordinary", amount: 150_00 }],
			),
		).toBe(250_00);
	});

	it("never returns negative when moved exceeds allocated", () => {
		expect(
			computeExtraordinarySavingsPoolCents(
				[
					{
						incomeKind: "extraordinary",
						distributionApplied: { savings: 100_00 },
					},
				],
				[{ fromEnvelope: "extraordinary", amount: 200_00 }],
			),
		).toBe(0);
	});
});

describe("balancesAfterClosedCycleSurplusMove", () => {
	it("lowers Needs, Wants, and extraordinary, and leaves regular Savings", () => {
		// S/ 120 Needs, S/ 45 Wants, S/ 200 Savings of which S/ 50 is extraordinary.
		const after = balancesAfterClosedCycleSurplusMove(
			{
				needsRemainingCents: 120_00,
				wantsRemainingCents: 45_00,
				savingsRemainingCents: 200_00,
			},
			{ needsCents: 120_00, wantsCents: 45_00, extraordinaryCents: 50_00 },
		);
		expect(after).toEqual({
			needsRemainingCents: 0,
			wantsRemainingCents: 0,
			savingsRemainingCents: 150_00,
		});
	});
});

describe("computeAvailableExtraordinarySavingsForMove", () => {
	it("caps pool by savings envelope remaining", () => {
		expect(
			computeAvailableExtraordinarySavingsForMove({
				incomeEvents: [
					{
						incomeKind: "extraordinary",
						distributionApplied: { savings: 500_00 },
					},
				],
				surplusContributions: [],
				savingsEnvelopeRemainingCents: 300_00,
			}),
		).toBe(300_00);
	});

	it("uses pool when envelope has more remaining than pool", () => {
		expect(
			computeAvailableExtraordinarySavingsForMove({
				incomeEvents: [
					{
						incomeKind: "extraordinary",
						distributionApplied: { savings: 200_00 },
					},
				],
				surplusContributions: [{ fromEnvelope: "extraordinary", amount: 50_00 }],
				savingsEnvelopeRemainingCents: 1_000_00,
			}),
		).toBe(150_00);
	});
});
