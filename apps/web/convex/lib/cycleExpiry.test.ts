import { describe, expect, it } from "vitest";
import { limaDatePartsToTimestamp } from "../../shared/lib/date";
import {
	isCycleExpiredInLima,
	shouldCloseExpiredCycle,
	splitExpiredActiveCycle,
} from "./cycleExpiry";

const PAYDAY = limaDatePartsToTimestamp({ year: 2026, month: 10, day: 10 });

describe("isCycleExpiredInLima", () => {
	it("detects a cycle whose pay date is a past Lima calendar day", () => {
		const dayAfter = limaDatePartsToTimestamp({ year: 2026, month: 10, day: 11 });
		expect(isCycleExpiredInLima(PAYDAY, dayAfter)).toBe(true);
	});

	it("keeps the cycle open the Lima day before its pay date", () => {
		const dayBefore = limaDatePartsToTimestamp({ year: 2026, month: 10, day: 9 });
		expect(isCycleExpiredInLima(PAYDAY, dayBefore + 12 * 60 * 60 * 1000)).toBe(false);
	});

	it("treats Lima midnight of the pay date as expired and the previous millisecond as open", () => {
		expect(isCycleExpiredInLima(PAYDAY, PAYDAY - 1)).toBe(false);
		expect(isCycleExpiredInLima(PAYDAY, PAYDAY)).toBe(true);
	});

	it("does not expire at UTC midnight while Lima is still the previous evening", () => {
		const utcMidnight = Date.parse("2026-10-10T00:00:00.000Z");
		expect(utcMidnight).toBeLessThan(PAYDAY);
		expect(isCycleExpiredInLima(PAYDAY, utcMidnight)).toBe(false);
	});
});

describe("shouldCloseExpiredCycle", () => {
	it("closes an active cycle past its Lima pay date and does not ask for a new one", () => {
		expect(shouldCloseExpiredCycle({ status: "active", endDate: PAYDAY }, PAYDAY)).toBe("close");
	});

	it("leaves a cycle that has not reached its Lima pay date", () => {
		expect(shouldCloseExpiredCycle({ status: "active", endDate: PAYDAY }, PAYDAY - 1)).toBe("keep");
	});

	it("leaves a missing cycle", () => {
		expect(shouldCloseExpiredCycle(null, PAYDAY)).toBe("keep");
	});
});

describe("splitExpiredActiveCycle", () => {
	it("presents a past-due active cycle as closed and keeps no active cycle", () => {
		const cycle = { status: "active" as const, endDate: PAYDAY };
		expect(splitExpiredActiveCycle(cycle, PAYDAY)).toEqual({ active: null, expired: cycle });
	});

	it("keeps a cycle that has not reached Lima midnight of its pay date", () => {
		const cycle = { status: "active" as const, endDate: PAYDAY };
		expect(splitExpiredActiveCycle(cycle, PAYDAY - 1)).toEqual({ active: cycle, expired: null });
	});
});
