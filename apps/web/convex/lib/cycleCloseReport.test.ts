import { describe, expect, it } from "vitest";
import {
	buildCycleCloseReport,
	buildCycleLabel,
	type CycleCloseReportInput,
	computeEnvelopeSpentCents,
	isCloseReportEligible,
	isJustClosedAfterCycleClose,
} from "./cycleCloseReport";
import { cycleCountsForStreakAndGreen } from "./evaluateClosedCycle";

const MS_PER_DAY = 86_400_000;

describe("buildCycleCloseReport", () => {
	it("returns zeros for an empty closed cycle", () => {
		const result = buildCycleCloseReport({
			cycleStartDate: Date.UTC(2026, 6, 1),
			incomeEvents: [],
			envelopes: [],
			cycleHistory: { status: "compliant" },
			streak: 0,
		});

		expect(result.totalIncomeCents).toBe(0);
		expect(result.savingsCents).toBe(0);
		expect(result.streak).toBe(0);
		expect(result.hasExtraordinaryIncome).toBe(false);
		expect(result.spendByEnvelope).toEqual([
			{ type: "needs", label: "Necesidades", spentCents: 0 },
			{ type: "wants", label: "Gustos", spentCents: 0 },
			{ type: "savings", label: "Ahorro", spentCents: 0 },
		]);
	});

	it("aggregates income and spend per envelope", () => {
		const result = buildCycleCloseReport({
			cycleStartDate: Date.UTC(2026, 6, 1),
			incomeEvents: [
				{ amount: 3_000_00, incomeKind: "habitual" },
				{ amount: 500_00, incomeKind: "habitual" },
			],
			envelopes: [
				{
					type: "needs",
					allocatedAmount: 1_750_00,
					remainingAmount: 250_00,
				},
				{
					type: "wants",
					allocatedAmount: 1_050_00,
					remainingAmount: 400_00,
				},
				{
					type: "savings",
					allocatedAmount: 700_00,
					remainingAmount: 200_00,
				},
			],
			cycleHistory: { status: "warning" },
			streak: 2,
		});

		expect(result.totalIncomeCents).toBe(3_500_00);
		expect(result.spendByEnvelope).toEqual([
			{ type: "needs", label: "Necesidades", spentCents: 1_500_00 },
			{ type: "wants", label: "Gustos", spentCents: 650_00 },
			{ type: "savings", label: "Ahorro", spentCents: 500_00 },
		]);
		expect(result.savingsCents).toBe(500_00);
		expect(result.streak).toBe(2);
		expect(result.status).toBe("warning");
		expect(result.hasExtraordinaryIncome).toBe(false);
	});

	it("stays the same when leftover is carried or moved without changing remaining", () => {
		const input: CycleCloseReportInput = {
			cycleStartDate: Date.UTC(2026, 6, 1),
			incomeEvents: [{ amount: 3_500_00, incomeKind: "habitual" }],
			envelopes: [
				{ type: "needs", allocatedAmount: 1_750_00, remainingAmount: 250_00 },
				{ type: "wants", allocatedAmount: 1_050_00, remainingAmount: 400_00 },
				{ type: "savings", allocatedAmount: 700_00, remainingAmount: 200_00 },
			],
			cycleHistory: { status: "warning" },
			streak: 2,
		};
		const before = buildCycleCloseReport(input);
		const withCarryNoted = buildCycleCloseReport({
			...input,
			envelopes: input.envelopes.map((envelope) => ({
				...envelope,
				carriedOverCents: envelope.remainingAmount,
			})),
		});
		const ifRemainingDropped = buildCycleCloseReport({
			...input,
			envelopes: input.envelopes.map((envelope) => ({
				...envelope,
				remainingAmount: 0,
			})),
		});

		expect(withCarryNoted).toEqual(before);
		expect(ifRemainingDropped).not.toEqual(before);
		expect(before.spendByEnvelope).toEqual([
			{ type: "needs", label: "Necesidades", spentCents: 1_500_00 },
			{ type: "wants", label: "Gustos", spentCents: 650_00 },
			{ type: "savings", label: "Ahorro", spentCents: 500_00 },
		]);
	});

	it("flags extraordinary income in the report", () => {
		const result = buildCycleCloseReport({
			cycleStartDate: Date.UTC(2026, 11, 1),
			incomeEvents: [
				{ amount: 2_000_00, incomeKind: "habitual" },
				{ amount: 1_200_00, incomeKind: "extraordinary" },
			],
			envelopes: [
				{
					type: "needs",
					allocatedAmount: 1_000_00,
					remainingAmount: 1_000_00,
				},
				{
					type: "wants",
					allocatedAmount: 600_00,
					remainingAmount: 600_00,
				},
				{
					type: "savings",
					allocatedAmount: 1_600_00,
					remainingAmount: 0,
				},
			],
			cycleHistory: { status: "compliant" },
			streak: 4,
		});

		expect(result.hasExtraordinaryIncome).toBe(true);
		expect(result.totalIncomeCents).toBe(3_200_00);
	});
});

describe("computeEnvelopeSpentCents", () => {
	it("never returns negative spend", () => {
		expect(computeEnvelopeSpentCents(100, 150)).toBe(0);
	});
});

describe("streakEvaluated on the close report", () => {
	const startDate = Date.parse("2026-10-09T15:00:00-05:00");

	it("is false for an opening cycle and for a close under 24 hours", () => {
		expect(
			cycleCountsForStreakAndGreen({
				isOpeningCycle: true,
				startDate,
				closeAt: startDate + MS_PER_DAY,
			}),
		).toBe(false);
		expect(
			cycleCountsForStreakAndGreen({
				isOpeningCycle: false,
				startDate,
				closeAt: startDate + 20 * 60 * 1000,
			}),
		).toBe(false);
	});

	it("is true for a non-opening cycle that lasted at least 24 hours", () => {
		expect(
			cycleCountsForStreakAndGreen({
				isOpeningCycle: false,
				startDate,
				closeAt: startDate + MS_PER_DAY,
			}),
		).toBe(true);
	});
});

describe("buildCycleLabel", () => {
	it("capitalizes the Lima month name", () => {
		expect(buildCycleLabel(Date.UTC(2026, 6, 15))).toMatch(/^Julio$/);
	});
});

describe("isCloseReportEligible", () => {
	it("returns false when the cycle closed on a free plan", () => {
		expect(isCloseReportEligible(false)).toBe(false);
		expect(isCloseReportEligible(undefined)).toBe(false);
	});

	it("returns true when the cycle closed on premium", () => {
		expect(isCloseReportEligible(true)).toBe(true);
	});
});

describe("isJustClosedAfterCycleClose", () => {
	const now = Date.UTC(2026, 7, 3);

	it("returns true during the first week of the new cycle", () => {
		expect(
			isJustClosedAfterCycleClose({
				activeCycleDaysElapsed: 2,
				closedCycleEvaluatedAt: now - MS_PER_DAY,
				now,
			}),
		).toBe(true);
	});

	it("returns false after the early window", () => {
		expect(
			isJustClosedAfterCycleClose({
				activeCycleDaysElapsed: 10,
				closedCycleEvaluatedAt: now - 10 * MS_PER_DAY,
				now,
			}),
		).toBe(false);
	});
});
