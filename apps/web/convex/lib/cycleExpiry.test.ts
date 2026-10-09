import { describe, expect, it } from "vitest";
import { limaDatePartsToTimestamp } from "../../shared/lib/date";
import { computeCycleCarryover, envelopeWithCarry } from "./cycleCarryover";
import { activeCycleAcceptsExpense, pastEndClosedCard, signedCarryoverCents } from "./cycleExpiry";
import {
	computeCycleDayMetrics,
	computeDailyAvailable,
	isCyclePastEnd,
	MS_PER_DAY,
} from "./dashboardMath";
import { resolveCycleForIncome } from "./incomeEventLogic";

const PAYDAY = limaDatePartsToTimestamp({ year: 2026, month: 10, day: 10 });
const START = limaDatePartsToTimestamp({ year: 2026, month: 9, day: 10 });

describe("pastEnd metrics", () => {
	it("stays open before Lima midnight and closed at Lima midnight, not at UTC midnight", () => {
		expect(isCyclePastEnd(PAYDAY, PAYDAY - 1)).toBe(false);
		expect(isCyclePastEnd(PAYDAY, PAYDAY)).toBe(true);
		expect(isCyclePastEnd(PAYDAY, Date.parse("2026-10-10T00:00:00.000Z"))).toBe(false);
	});

	it("keeps remaining days at zero and daily available finite and non-negative", () => {
		const now = PAYDAY + 3 * 60 * 60 * 1000;
		expect(isCyclePastEnd(PAYDAY, now)).toBe(true);
		const metrics = computeCycleDayMetrics(START, PAYDAY, now);
		expect(metrics.daysRemaining).toBe(0);
		expect(metrics.daysRemaining).toBeGreaterThanOrEqual(0);
		const daily = computeDailyAvailable(12_00, -4_00, metrics.daysRemaining);
		expect(Number.isFinite(daily)).toBe(true);
		expect(daily).toBeGreaterThanOrEqual(0);
		expect(computeDailyAvailable(12_00, 8_00, 0)).toBe(20_00);
	});
});

describe("pastEndClosedCard", () => {
	const cycle = {
		_id: "cycle-1",
		status: "active" as const,
		startDate: START,
		endDate: PAYDAY,
	};

	it("uses the signed carryover, including a negative leftover", () => {
		const card = pastEndClosedCard({
			pastEnd: true,
			cycle,
			envelopes: [
				{ type: "needs", remainingAmount: -5_000 },
				{ type: "wants", remainingAmount: -200 },
				{ type: "savings", remainingAmount: -100 },
			],
			incomeEvents: [],
			surplusContributions: [],
		});
		expect(card?.surplusCents).toBe(-5_300);
		expect(card?.surplusCents).toBe(
			signedCarryoverCents({
				envelopes: [
					{ type: "needs", remainingAmount: -5_000 },
					{ type: "wants", remainingAmount: -200 },
					{ type: "savings", remainingAmount: -100 },
				],
				closeSurplusMovedAt: undefined,
				surplusContributions: [],
				incomeEvents: [],
			}),
		);
		expect(cycle.status).toBe("active");
	});

	it("is absent when the cycle is not past its end", () => {
		expect(
			pastEndClosedCard({
				pastEnd: false,
				cycle,
				envelopes: [],
				incomeEvents: [],
				surplusContributions: [],
			}),
		).toBeNull();
	});
});

describe("expense after expiry then habitual income", () => {
	it("accepts the expense into the active cycle and carries that leftover once", () => {
		const expenseAt = PAYDAY + MS_PER_DAY;
		const cycle = { _id: "cycle-1", status: "active" as const, startDate: START, endDate: PAYDAY };
		const needsBefore = 10_000;
		const expense = 1_500;

		expect(isCyclePastEnd(PAYDAY, expenseAt)).toBe(true);
		expect(activeCycleAcceptsExpense(cycle, expenseAt)).toBe(true);
		expect(cycle.status).toBe("active");

		const needsAfterExpense = needsBefore - expense;
		const resolved = resolveCycleForIncome({
			activeCycle: { ...cycle, isOpeningCycle: false },
			occurredAt: expenseAt,
			now: expenseAt,
			incomeKind: "habitual",
		});
		expect(resolved).toBeNull();

		const envelopes = [
			{ type: "needs" as const, remainingAmount: needsAfterExpense },
			{ type: "wants" as const, remainingAmount: 0 },
			{ type: "savings" as const, remainingAmount: 0 },
		];
		const carry = computeCycleCarryover({
			envelopes,
			closeSurplusMovedAt: undefined,
			surplusContributions: [],
			incomeEvents: [],
		});
		const opened = envelopeWithCarry(0, carry.needs);
		expect(carry.needs).toBe(needsBefore - expense);
		expect(opened.carriedOverCents).toBe(needsBefore - expense);
		expect(opened.carriedOverCents).not.toBe(needsBefore);
		expect(opened.carriedOverCents).not.toBe(needsBefore - expense * 2);
	});

	it("rejects an expense when there is no active cycle", () => {
		expect(activeCycleAcceptsExpense(null, PAYDAY + 1)).toBe(false);
		expect(activeCycleAcceptsExpense({ status: "closed", endDate: PAYDAY }, PAYDAY + 1)).toBe(
			false,
		);
	});
});
