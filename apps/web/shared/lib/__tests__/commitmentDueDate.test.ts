import { describe, expect, it } from "vitest";
import {
	advanceNextDueAt,
	computeInitialNextDueAt,
	computeNextDueAtAfterPayment,
	daysUntilNextDue,
	isPastNextDue,
	resolveCommitmentNextDueAt,
} from "@/shared/lib/commitmentDueDate";

// 2026-01-20 12:00 Lima
const JAN_20_NOON = new Date("2026-01-20T17:00:00.000Z").getTime();
// 2026-01-06 12:00 Lima
const JAN_6_NOON = new Date("2026-01-06T17:00:00.000Z").getTime();
// 2026-02-06 00:00 Lima
const FEB_6 = new Date("2026-02-06T05:00:00.000Z").getTime();
// 2026-02-07 12:00 Lima
const FEB_7_NOON = new Date("2026-02-07T17:00:00.000Z").getTime();
// 2026-03-15 12:00 Lima
const MAR_15_NOON = new Date("2026-03-15T17:00:00.000Z").getTime();

describe("computeInitialNextDueAt", () => {
	it("uses next month when due day already passed in creation month", () => {
		expect(computeInitialNextDueAt(6, JAN_20_NOON)).toBe(FEB_6);
	});

	it("uses current month when due day is still ahead", () => {
		expect(computeInitialNextDueAt(6, JAN_6_NOON)).toBe(
			new Date("2026-01-06T05:00:00.000Z").getTime(),
		);
	});

	it("uses today when created on the due day", () => {
		const dueToday = computeInitialNextDueAt(6, JAN_6_NOON);
		expect(daysUntilNextDue(dueToday, JAN_6_NOON)).toBe(0);
	});
});

describe("advanceNextDueAt", () => {
	it("moves to the same day next month", () => {
		expect(advanceNextDueAt(FEB_6, 6)).toBe(new Date("2026-03-06T05:00:00.000Z").getTime());
	});
});

describe("payment due comparisons", () => {
	it("is pending before the next due date", () => {
		expect(isPastNextDue(FEB_6, JAN_20_NOON)).toBe(false);
		expect(daysUntilNextDue(FEB_6, JAN_20_NOON)).toBe(17);
	});

	it("is due today on the due date", () => {
		expect(isPastNextDue(FEB_6, FEB_6)).toBe(false);
		expect(daysUntilNextDue(FEB_6, FEB_6)).toBe(0);
	});

	it("is overdue after the due date", () => {
		expect(isPastNextDue(FEB_6, FEB_7_NOON)).toBe(true);
	});
});

describe("computeNextDueAtAfterPayment", () => {
	it("advances one month when payment is on time", () => {
		expect(
			computeNextDueAtAfterPayment({
				currentNextDueAt: FEB_6,
				dueDay: 6,
				now: FEB_6,
			}),
		).toBe(new Date("2026-03-06T05:00:00.000Z").getTime());
	});

	it("skips to the next future due when payment is late", () => {
		expect(
			computeNextDueAtAfterPayment({
				currentNextDueAt: FEB_6,
				dueDay: 6,
				now: MAR_15_NOON,
			}),
		).toBe(new Date("2026-04-06T05:00:00.000Z").getTime());
	});
});

describe("resolveCommitmentNextDueAt", () => {
	it("prefers persisted nextDueAt", () => {
		expect(
			resolveCommitmentNextDueAt({
				dueDay: 6,
				nextDueAt: FEB_6,
				createdAt: JAN_20_NOON,
			}),
		).toBe(FEB_6);
	});

	it("falls back to initial due from creation time", () => {
		expect(
			resolveCommitmentNextDueAt({
				dueDay: 6,
				createdAt: JAN_20_NOON,
			}),
		).toBe(FEB_6);
	});
});
