import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { computeCycleCarryover } from "./cycleCarryover";
import { isCyclePastEnd } from "./dashboardMath";
import {
	EXTRA_BEFORE_CYCLE_MESSAGE,
	FUTURE_INCOME_DATE_MESSAGE,
	futureIncomeDateMessage,
	NO_ACTIVE_CYCLE_MESSAGE,
	rejectExtraordinaryBeforeCycleStart,
	rejectFutureIncomeDate,
	rejectIncomeDateForKind,
	resolveCycleForIncome,
} from "./incomeEventLogic";

const HOUR = 60 * 60 * 1000;
const _DAY = 24 * HOUR;

describe("futureIncomeDateMessage", () => {
	const now = Date.parse("2026-10-09T20:00:00.000Z");

	it("allows later today and rejects the next Lima day", () => {
		expect(futureIncomeDateMessage(now + 60_000, now)).toBeNull();
		expect(futureIncomeDateMessage(now - 60_000, now)).toBeNull();
		const tomorrow = Date.parse("2026-10-10T15:00:00-05:00");
		expect(futureIncomeDateMessage(tomorrow, now)).toBe(FUTURE_INCOME_DATE_MESSAGE);
	});

	it("uses the Lima day around midnight in both directions", () => {
		const beforeMidnight = Date.parse("2026-10-10T04:30:00Z");
		const laterToday = Date.parse("2026-10-10T04:50:00Z");
		const limaTomorrow = Date.parse("2026-10-10T05:30:00Z");
		expect(futureIncomeDateMessage(laterToday, beforeMidnight)).toBeNull();
		expect(futureIncomeDateMessage(limaTomorrow, beforeMidnight)).toBe(FUTURE_INCOME_DATE_MESSAGE);

		const justAfterMidnight = Date.parse("2026-10-10T05:30:00Z");
		const laterThatDay = Date.parse("2026-10-10T23:00:00Z");
		const nextLimaDay = Date.parse("2026-10-11T05:30:00Z");
		expect(futureIncomeDateMessage(laterThatDay, justAfterMidnight)).toBeNull();
		expect(futureIncomeDateMessage(beforeMidnight, justAfterMidnight)).toBeNull();
		expect(futureIncomeDateMessage(nextLimaDay, justAfterMidnight)).toBe(
			FUTURE_INCOME_DATE_MESSAGE,
		);
		for (const incomeKind of ["habitual", "extraordinary"] as const) {
			expect(() => rejectIncomeDateForKind(incomeKind, laterToday, beforeMidnight)).not.toThrow();
			expect(() => rejectIncomeDateForKind(incomeKind, limaTomorrow, beforeMidnight)).toThrow(
				ConvexError,
			);
		}
	});

	it("throws the same ConvexError create and edit share", () => {
		const tomorrow = Date.parse("2026-10-10T15:00:00-05:00");
		expect(() => rejectFutureIncomeDate(tomorrow, now)).toThrow(ConvexError);
		expect(() => rejectFutureIncomeDate(now, now)).not.toThrow();
	});
});

describe("resolveCycleForIncome kind", () => {
	const now = new Date("2026-07-15T12:00:00Z").getTime();
	const day = 24 * 60 * 60 * 1000;
	const cycleStart = new Date("2026-07-01T00:00:00Z").getTime();
	const cycleEnd = new Date("2026-07-31T00:00:00Z").getTime();
	const activeCycle = { _id: "active", startDate: cycleStart, endDate: cycleEnd };

	it("closes on a habitual income at any date, including 10 days before the end", () => {
		for (const occurredAt of [
			cycleEnd - 10 * day,
			new Date("2026-07-10T00:00:00Z").getTime(),
			new Date("2026-08-15T00:00:00Z").getTime(),
			cycleEnd,
		]) {
			expect(
				resolveCycleForIncome({ activeCycle, occurredAt, now, incomeKind: "habitual" }),
			).toBeNull();
			expect(
				resolveCycleForIncome({ activeCycle, occurredAt, now, incomeKind: undefined }),
			).toBeNull();
		}
	});

	it("refuses to open a cycle for an extraordinary income when none is active", () => {
		const open = () =>
			resolveCycleForIncome({
				activeCycle: null,
				occurredAt: now,
				now,
				incomeKind: "extraordinary",
			});
		expect(open).toThrow(ConvexError);
		try {
			open();
		} catch (error) {
			if (!(error instanceof ConvexError)) throw error;
			expect(error.data).toMatchObject({
				code: "NO_ACTIVE_CYCLE",
				message: NO_ACTIVE_CYCLE_MESSAGE,
			});
		}
	});

	it("still opens a cycle for a habitual income when none is active", () => {
		expect(
			resolveCycleForIncome({
				activeCycle: null,
				occurredAt: now,
				now,
				incomeKind: "habitual",
			}),
		).toBeNull();
		expect(
			resolveCycleForIncome({
				activeCycle: null,
				occurredAt: now,
				now,
				incomeKind: undefined,
			}),
		).toBeNull();
	});

	it("adds an extraordinary income to an expired cycle that is still active", () => {
		const day = 24 * 60 * 60 * 1000;
		const expired = {
			_id: "expired-active",
			startDate: now - 40 * day,
			endDate: now - day,
		};
		expect(isCyclePastEnd(expired.endDate, now)).toBe(true);
		for (const occurredAt of [expired.endDate, now]) {
			expect(
				resolveCycleForIncome({
					activeCycle: expired,
					occurredAt,
					now,
					incomeKind: "extraordinary",
				}),
			).toBe("expired-active");
			expect(() => rejectIncomeDateForKind("extraordinary", occurredAt, now)).not.toThrow();
			expect(() =>
				rejectExtraordinaryBeforeCycleStart("extraordinary", occurredAt, expired.startDate),
			).not.toThrow();
		}
	});

	it("rejects an extraordinary income dated before the active cycle start", () => {
		const day = 24 * 60 * 60 * 1000;
		const startDate = now - 10 * day;
		const beforeStart = () =>
			rejectExtraordinaryBeforeCycleStart("extraordinary", startDate - day, startDate);
		expect(beforeStart).toThrow(ConvexError);
		try {
			beforeStart();
		} catch (error) {
			if (!(error instanceof ConvexError)) throw error;
			expect(error.data).toMatchObject({
				code: "VALIDATION_ERROR",
				message: EXTRA_BEFORE_CYCLE_MESSAGE,
				data: { field: "occurredAt" },
			});
		}
		expect(() =>
			rejectExtraordinaryBeforeCycleStart("habitual", startDate - day, startDate),
		).not.toThrow();
		expect(() =>
			rejectExtraordinaryBeforeCycleStart("extraordinary", startDate, startDate),
		).not.toThrow();
	});

	it("closes an expired active cycle on a habitual income and carries its envelopes", () => {
		const day = 24 * 60 * 60 * 1000;
		const expired = {
			_id: "expired-active",
			startDate: now - 40 * day,
			endDate: now - day,
		};
		expect(isCyclePastEnd(expired.endDate, now)).toBe(true);
		expect(
			resolveCycleForIncome({
				activeCycle: expired,
				occurredAt: now,
				now,
				incomeKind: "habitual",
			}),
		).toBeNull();
		expect(
			computeCycleCarryover({
				envelopes: [
					{ type: "needs", remainingAmount: -100 },
					{ type: "wants", remainingAmount: 50 },
					{ type: "savings", remainingAmount: -30 },
				],
				closeSurplusMovedAt: undefined,
				surplusContributions: [],
				incomeEvents: [],
			}),
		).toEqual({ needs: -100, wants: 50, savings: -30, extraordinary: 0 });
	});

	it("throws NO_ACTIVE_CYCLE for an extraordinary income when the profile has no cycle", () => {
		const open = () =>
			resolveCycleForIncome({
				activeCycle: null,
				occurredAt: now + 24 * 60 * 60 * 1000,
				now,
				incomeKind: "extraordinary",
			});
		expect(open).toThrow(ConvexError);
		try {
			open();
		} catch (error) {
			if (!(error instanceof ConvexError)) throw error;
			expect(error.data).toMatchObject({
				code: "NO_ACTIVE_CYCLE",
				message: NO_ACTIVE_CYCLE_MESSAGE,
			});
		}
	});

	it("never closes on an extraordinary income, before, inside, or after the cycle", () => {
		for (const occurredAt of [
			new Date("2026-06-15T00:00:00Z").getTime(),
			new Date("2026-07-10T00:00:00Z").getTime(),
			new Date("2026-08-15T00:00:00Z").getTime(),
			cycleEnd,
		]) {
			expect(
				resolveCycleForIncome({
					activeCycle,
					occurredAt,
					now,
					incomeKind: "extraordinary",
				}),
			).toBe("active");
		}
	});
});
