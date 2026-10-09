import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { computeCycleCarryover, envelopeWithCarry } from "./cycleCarryover";
import { MS_PER_DAY } from "./dashboardMath";
import { openingCycleSkipsProgress, streakAfterClose } from "./evaluateClosedCycle";
import {
	assertFirstCycleAvailable,
	assertOpeningBalanceCents,
	FIRST_CYCLE_EXISTS_MESSAGE,
	OPENING_BALANCE_MESSAGE,
	openingEnvelopes,
} from "./firstCycle";
import { resolveCycleForIncome } from "./incomeEventLogic";

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
	const opening = { _id: "opening", startDate, endDate, isOpeningCycle: true };
	const envelopes = openingEnvelopes({ openingBalanceCents: 10_000, ...WEIGHTS });

	function openingCarry() {
		return computeCycleCarryover({
			envelopes: envelopes.map((envelope) => ({
				type: envelope.type,
				remainingAmount: envelope.remainingAmount,
			})),
			closeSurplusMovedAt: undefined,
			surplusContributions: [],
			incomeEvents: [],
		});
	}

	it("keeps a habitual income three days before payday on the opening cycle", () => {
		const occurredAt = endDate - 3 * MS_PER_DAY;
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt,
				now: occurredAt,
				incomeKind: "habitual",
			}),
		).toBe("opening");
	});

	it("opens the next cycle and carries a habitual income two days before payday", () => {
		const occurredAt = endDate - 2 * MS_PER_DAY;
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt,
				now: occurredAt,
				incomeKind: "habitual",
			}),
		).toBeNull();
		const carry = openingCarry();
		expect(carry).toEqual({ needs: 5_000, wants: 3_000, savings: 2_000, extraordinary: 0 });
		expect(envelopeWithCarry(5_000, carry.needs)).toEqual({
			allocatedAmount: 10_000,
			remainingAmount: 10_000,
			carriedOverCents: 5_000,
		});
	});

	it("opens the next cycle and carries a habitual income on the pay day", () => {
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt: endDate,
				now: endDate,
				incomeKind: "habitual",
			}),
		).toBeNull();
		expect(openingCarry().needs).toBe(5_000);
		expect(envelopeWithCarry(5_000, openingCarry().needs).carriedOverCents).toBe(5_000);
	});

	it("keeps an extraordinary income one day before payday on the opening cycle", () => {
		const occurredAt = endDate - MS_PER_DAY;
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt,
				now: occurredAt,
				incomeKind: "extraordinary",
			}),
		).toBe("opening");
	});

	it("keeps the current rule when the income is dated before the opening cycle", () => {
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt: startDate - 1,
				now: startDate,
				incomeKind: "habitual",
			}),
		).toBeNull();
	});

	it("does not apply the early window to a regular cycle", () => {
		const occurredAt = endDate - 2 * MS_PER_DAY;
		expect(
			resolveCycleForIncome({
				activeCycle: { ...opening, isOpeningCycle: false },
				occurredAt,
				now: occurredAt,
				incomeKind: "habitual",
			}),
		).toBe("opening");
	});
});
