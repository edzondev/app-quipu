import { describe, expect, it } from "vitest";
import {
	computeAvailableExtraordinarySavingsForMove,
	computeExtraordinarySavingsPoolCents,
	resolveSurplusMove,
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
});

describe("resolveSurplusMove", () => {
	it("returns the only positive envelope as moveSurplusToSavings args", () => {
		expect(
			resolveSurplusMove({
				needsRemainingCents: 0,
				wantsRemainingCents: 21_000,
				extraordinaryAvailableCents: 0,
			}),
		).toEqual({ fromEnvelope: "wants", amount: 21_000 });
		expect(
			resolveSurplusMove({
				needsRemainingCents: 4_000,
				wantsRemainingCents: 0,
				extraordinaryAvailableCents: 0,
			}),
		).toEqual({ fromEnvelope: "needs", amount: 4_000 });
		expect(
			resolveSurplusMove({
				needsRemainingCents: 0,
				wantsRemainingCents: 0,
				extraordinaryAvailableCents: 9_600,
			}),
		).toEqual({ fromEnvelope: "extraordinary", amount: 9_600 });
	});

	it("returns null when no source or more than one source has surplus", () => {
		expect(
			resolveSurplusMove({
				needsRemainingCents: 0,
				wantsRemainingCents: 0,
				extraordinaryAvailableCents: 0,
			}),
		).toBeNull();
		expect(
			resolveSurplusMove({
				needsRemainingCents: 100,
				wantsRemainingCents: 200,
				extraordinaryAvailableCents: 0,
			}),
		).toBeNull();
	});

	it("ignores non-integer or negative amounts", () => {
		expect(
			resolveSurplusMove({
				needsRemainingCents: 1.5,
				wantsRemainingCents: 0,
				extraordinaryAvailableCents: 0,
			}),
		).toBeNull();
		expect(
			resolveSurplusMove({
				needsRemainingCents: -50,
				wantsRemainingCents: 0,
				extraordinaryAvailableCents: 80,
			}),
		).toEqual({ fromEnvelope: "extraordinary", amount: 80 });
	});
});

describe("computeAvailableExtraordinarySavingsForMove cap", () => {
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
