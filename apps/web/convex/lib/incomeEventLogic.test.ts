import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
	FUTURE_INCOME_DATE_MESSAGE,
	futureIncomeDateMessage,
	NO_ACTIVE_CYCLE_MESSAGE,
	rejectFutureIncomeDate,
	resolveCycleForIncome,
} from "./incomeEventLogic";

const HOUR = 60 * 60 * 1000;
const _DAY = 24 * HOUR;

describe("futureIncomeDateMessage", () => {
	const now = Date.parse("2026-10-09T20:00:00.000Z");

	it("rejects a timestamp after now with the edit message", () => {
		expect(futureIncomeDateMessage(now + 1, now)).toBe(FUTURE_INCOME_DATE_MESSAGE);
	});

	it("allows now and earlier dates", () => {
		expect(futureIncomeDateMessage(now, now)).toBeNull();
		expect(futureIncomeDateMessage(now - 60_000, now)).toBeNull();
	});

	it("throws the same ConvexError create and edit share", () => {
		expect(() => rejectFutureIncomeDate(now + 1, now)).toThrow(ConvexError);
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
