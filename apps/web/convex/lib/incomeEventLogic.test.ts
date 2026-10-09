import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
	FUTURE_INCOME_DATE_MESSAGE,
	futureIncomeDateMessage,
	rejectFutureIncomeDate,
	resolveCycleForEvent,
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

describe("resolveCycleForEvent", () => {
	const now = new Date("2026-07-15T12:00:00Z").getTime();
	const cycleStart = new Date("2026-07-01T00:00:00Z").getTime();
	const cycleEnd = new Date("2026-07-31T00:00:00Z").getTime();

	it("returns the active cycle when occurredAt is within range", () => {
		const result = resolveCycleForEvent({
			activeCycle: { _id: "active", startDate: cycleStart, endDate: cycleEnd },
			occurredAt: new Date("2026-07-10T00:00:00Z").getTime(),
			now,
		});
		expect(result).toBe("active");
	});

	it("returns null (create new cycle) when no active cycle", () => {
		const result = resolveCycleForEvent({
			activeCycle: null,
			occurredAt: now,
			now,
		});
		expect(result).toBeNull();
	});

	it("returns null when occurredAt is before the active cycle", () => {
		// Event happened last month, no closed cycle in scope: create a new one.
		const result = resolveCycleForEvent({
			activeCycle: { _id: "active", startDate: cycleStart, endDate: cycleEnd },
			occurredAt: new Date("2026-06-15T00:00:00Z").getTime(),
			now,
		});
		expect(result).toBeNull();
	});

	it("returns null when occurredAt is after the active cycle", () => {
		const result = resolveCycleForEvent({
			activeCycle: { _id: "active", startDate: cycleStart, endDate: cycleEnd },
			occurredAt: new Date("2026-08-15T00:00:00Z").getTime(),
			now,
		});
		expect(result).toBeNull();
	});

	it("keeps an extraordinary income on the active cycle even outside its dates", () => {
		const activeCycle = { _id: "active", startDate: cycleStart, endDate: cycleEnd };
		expect(
			resolveCycleForEvent({
				activeCycle,
				occurredAt: new Date("2026-06-15T00:00:00Z").getTime(),
				now,
				incomeKind: "extraordinary",
			}),
		).toBe("active");
		expect(
			resolveCycleForEvent({
				activeCycle,
				occurredAt: new Date("2026-08-15T00:00:00Z").getTime(),
				now,
				incomeKind: "extraordinary",
			}),
		).toBe("active");
	});
});

describe("resolveCycleForIncome kind", () => {
	const now = new Date("2026-07-15T12:00:00Z").getTime();
	const cycleStart = new Date("2026-07-01T00:00:00Z").getTime();
	const cycleEnd = new Date("2026-07-31T00:00:00Z").getTime();
	const activeCycle = { _id: "active", startDate: cycleStart, endDate: cycleEnd };

	it("closes on a habitual income outside the cycle, including a missing kind", () => {
		const occurredAt = new Date("2026-08-15T00:00:00Z").getTime();
		expect(
			resolveCycleForIncome({ activeCycle, occurredAt, now, incomeKind: "habitual" }),
		).toBeNull();
		expect(
			resolveCycleForIncome({ activeCycle, occurredAt, now, incomeKind: undefined }),
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
