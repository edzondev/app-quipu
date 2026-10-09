import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { computeCycleCarryover, envelopeWithCarry } from "./cycleCarryover";
import { openingCycleSkipsProgress, streakAfterClose } from "./evaluateClosedCycle";
import {
	assertFirstCycleAvailable,
	assertOpeningBalanceCents,
	FIRST_CYCLE_EXISTS_MESSAGE,
	OPENING_BALANCE_MESSAGE,
	openingEnvelopes,
} from "./firstCycle";
import { resolveCycleForEvent } from "./incomeEventLogic";

const WEIGHTS = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

function balanceError(openingBalanceCents: number): unknown {
	try {
		assertOpeningBalanceCents(openingBalanceCents);
		return null;
	} catch (error) {
		if (!(error instanceof ConvexError)) throw error;
		return error.data;
	}
}

describe("assertOpeningBalanceCents", () => {
	it("accepts zero and a positive integer of cents", () => {
		expect(() => assertOpeningBalanceCents(0)).not.toThrow();
		expect(() => assertOpeningBalanceCents(150_000)).not.toThrow();
	});

	it("rejects fractions and negatives", () => {
		for (const openingBalanceCents of [-1, 1.5, Number.NaN]) {
			expect(balanceError(openingBalanceCents)).toMatchObject({
				code: "VALIDATION_ERROR",
				message: OPENING_BALANCE_MESSAGE,
				data: { field: "openingBalanceCents" },
			});
		}
	});
});

describe("openingEnvelopes", () => {
	it("splits the opening balance with the profile percentages and stores it as carry", () => {
		expect(openingEnvelopes({ openingBalanceCents: 10_000, ...WEIGHTS })).toEqual([
			{ type: "needs", ...envelopeWithCarry(0, 5_000) },
			{ type: "wants", ...envelopeWithCarry(0, 3_000) },
			{ type: "savings", ...envelopeWithCarry(0, 2_000) },
		]);
	});

	it("keeps a zero balance as three empty envelopes", () => {
		expect(openingEnvelopes({ openingBalanceCents: 0, ...WEIGHTS })).toEqual([
			{ type: "needs", allocatedAmount: 0, remainingAmount: 0, carriedOverCents: 0 },
			{ type: "wants", allocatedAmount: 0, remainingAmount: 0, carriedOverCents: 0 },
			{ type: "savings", allocatedAmount: 0, remainingAmount: 0, carriedOverCents: 0 },
		]);
	});
});

describe("assertFirstCycleAvailable", () => {
	it("rejects when the profile already has a personal cycle", () => {
		expect(() => assertFirstCycleAvailable(false)).not.toThrow();
		try {
			assertFirstCycleAvailable(true);
			throw new Error("expected ALREADY_EXISTS");
		} catch (error) {
			if (!(error instanceof ConvexError)) throw error;
			expect(error.data).toMatchObject({
				code: "ALREADY_EXISTS",
				message: FIRST_CYCLE_EXISTS_MESSAGE,
			});
		}
	});
});

describe("streakAfterClose", () => {
	it("neither adds to nor breaks the streak for an opening cycle", () => {
		expect(openingCycleSkipsProgress(true)).toBe(true);
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "failed",
			}),
		).toBeNull();
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBeNull();
	});

	it("still updates the streak for a regular closed cycle", () => {
		expect(openingCycleSkipsProgress(undefined)).toBe(false);
		expect(openingCycleSkipsProgress(false)).toBe(false);
		expect(
			streakAfterClose({
				isOpeningCycle: undefined,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toEqual({ currentStreak: 4, longestStreak: 5 });
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "failed",
			}),
		).toEqual({ currentStreak: 0, longestStreak: 5 });
	});
});

describe("income against the opening cycle", () => {
	const startDate = Date.parse("2026-10-09T15:30:00-05:00");
	const endDate = Date.parse("2026-10-24T00:00:00-05:00");
	const opening = { _id: "opening", startDate, endDate };
	const envelopes = openingEnvelopes({ openingBalanceCents: 10_000, ...WEIGHTS });

	it("opens a new cycle and carries leftovers when the income is on or after endDate", () => {
		expect(
			resolveCycleForEvent({
				activeCycle: opening,
				occurredAt: endDate,
				now: endDate,
			}),
		).toBeNull();

		const carry = computeCycleCarryover({
			envelopes: envelopes.map((envelope) => ({
				type: envelope.type,
				remainingAmount: envelope.remainingAmount,
			})),
			closeSurplusMovedAt: undefined,
			surplusContributions: [],
			incomeEvents: [],
		});
		expect(carry).toEqual({ needs: 5_000, wants: 3_000, savings: 2_000, extraordinary: 0 });
		expect(envelopeWithCarry(5_000, carry.needs)).toEqual({
			allocatedAmount: 10_000,
			remainingAmount: 10_000,
			carriedOverCents: 5_000,
		});
	});

	it("keeps an income dated inside the opening window on that cycle", () => {
		const occurredAt = startDate + 60_000;
		expect(
			resolveCycleForEvent({
				activeCycle: opening,
				occurredAt,
				now: occurredAt,
			}),
		).toBe("opening");
	});

	it("keeps the current rule when the income is dated before the opening cycle", () => {
		expect(
			resolveCycleForEvent({
				activeCycle: opening,
				occurredAt: startDate - 1,
				now: startDate,
			}),
		).toBeNull();
	});
});
