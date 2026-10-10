import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { computeCycleCarryover, envelopeWithCarry } from "./cycleCarryover";
import { MS_PER_DAY } from "./dashboardMath";
import {
	closedGreenCountAfterClose,
	cycleCountsForStreakAndGreen,
	openingCycleSkipsStreak,
	streakAfterClose,
	wantsWithinBudgetOnClose,
} from "./evaluateClosedCycle";
import {
	assertFirstCycleAvailable,
	assertOpeningBalanceCents,
	FIRST_CYCLE_EXISTS_MESSAGE,
	firstCycleOnboardingRetry,
	OPENING_BALANCE_MESSAGE,
	onboardingCompleteOnCreate,
	openingEnvelopes,
} from "./firstCycle";
import { buildCycleChartBars } from "./gamificationMath";
import { cycleStartedOnLimaDay, resolveCycleForIncome } from "./incomeEventLogic";

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

describe("onboarding and the first cycle", () => {
	it("leaves onboarding incomplete when createProfile defers it", () => {
		expect(onboardingCompleteOnCreate(undefined)).toBe(true);
		expect(onboardingCompleteOnCreate(true)).toBe(true);
		expect(onboardingCompleteOnCreate(false)).toBe(false);
	});

	it("marks onboarding complete with the existing cycle instead of a half retry", () => {
		expect(firstCycleOnboardingRetry({ hasCycle: false, onboardingComplete: false })).toEqual({
			action: "create",
		});
		expect(firstCycleOnboardingRetry({ hasCycle: true, onboardingComplete: true })).toEqual({
			action: "already_exists",
		});
		expect(firstCycleOnboardingRetry({ hasCycle: true, onboardingComplete: false })).toEqual({
			action: "complete_existing",
		});
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
	const longStart = Date.parse("2026-10-01T12:00:00-05:00");
	const longClose = longStart + MS_PER_DAY;

	it("neither adds to nor breaks the streak for an opening cycle", () => {
		expect(openingCycleSkipsStreak(true)).toBe(true);
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				startDate: longStart,
				closeAt: longClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "failed",
			}),
		).toBeNull();
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				startDate: longStart,
				closeAt: longClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBeNull();
	});

	it("does not count an opening cycle in closed green cycles and still charts it", () => {
		const openingStart = Date.parse("2026-10-09T15:30:00-05:00");
		const closeAt = openingStart + MS_PER_DAY;
		expect(
			cycleCountsForStreakAndGreen({
				isOpeningCycle: true,
				startDate: openingStart,
				closeAt,
			}),
		).toBe(false);
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				startDate: openingStart,
				closeAt,
				currentStreak: 2,
				longestStreak: 4,
				compliance: "compliant",
			}),
		).toBeNull();
		expect(
			closedGreenCountAfterClose({
				isOpeningCycle: true,
				startDate: openingStart,
				closeAt,
				currentStreak: 2,
				longestStreak: 4,
				compliance: "compliant",
			}),
		).toBe(2);
		const bars = buildCycleChartBars([
			{
				status: "compliant",
				evaluatedAt: closeAt,
				cycleStart: openingStart,
				countsForStreak: false,
			},
		]);
		expect(bars.some((bar) => bar.cycleStart === openingStart && bar.status === "compliant")).toBe(
			true,
		);
	});

	it("keeps a cycle under 24 hours in history and out of the green count", () => {
		const startDate = Date.parse("2026-10-09T23:50:00-05:00");
		const closeAt = Date.parse("2026-10-10T00:10:00-05:00");
		expect(closeAt - startDate).toBe(20 * 60 * 1000);
		expect(cycleCountsForStreakAndGreen({ isOpeningCycle: false, startDate, closeAt })).toBe(false);
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBeNull();
		expect(
			closedGreenCountAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBe(3);
		const bars = buildCycleChartBars([
			{
				status: "compliant",
				evaluatedAt: closeAt,
				cycleStart: startDate,
				countsForStreak: true,
			},
		]);
		expect(bars.some((bar) => bar.cycleStart === startDate && bar.status === "compliant")).toBe(
			true,
		);
		const fullClose = startDate + MS_PER_DAY;
		expect(
			cycleCountsForStreakAndGreen({
				isOpeningCycle: false,
				startDate,
				closeAt: fullClose,
			}),
		).toBe(true);
		expect(
			closedGreenCountAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt: fullClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBe(4);
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt: fullClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toEqual({ currentStreak: 4, longestStreak: 5 });
	});

	it("counts the opening cycle in progress like any other cycle and still skips the streak", () => {
		const openingStart = Date.parse("2026-10-09T15:30:00-05:00");
		const laterStart = Date.parse("2026-11-09T15:30:00-05:00");
		const bars = buildCycleChartBars([
			{ status: "compliant", evaluatedAt: 1, cycleStart: openingStart, countsForStreak: false },
			{ status: "warning", evaluatedAt: 2, cycleStart: laterStart, countsForStreak: true },
		]);
		expect(bars.some((bar) => bar.cycleStart === openingStart && bar.status === "compliant")).toBe(
			true,
		);
		expect(bars.some((bar) => bar.cycleStart === laterStart && bar.status === "warning")).toBe(
			true,
		);
		expect(
			wantsWithinBudgetOnClose({ remainingAmount: 2_500, carriedOverCents: 3_000 }, true),
		).toBe(true);
		expect(
			wantsWithinBudgetOnClose({ remainingAmount: 2_500, carriedOverCents: 3_000 }, false),
		).toBe(false);
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				startDate: longStart,
				closeAt: longClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBeNull();
	});

	it("still updates the streak for a regular closed cycle", () => {
		expect(openingCycleSkipsStreak(undefined)).toBe(false);
		expect(openingCycleSkipsStreak(false)).toBe(false);
		expect(
			streakAfterClose({
				isOpeningCycle: undefined,
				startDate: longStart,
				closeAt: longClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toEqual({ currentStreak: 4, longestStreak: 5 });
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				startDate: longStart,
				closeAt: longClose,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "failed",
			}),
		).toEqual({ currentStreak: 0, longestStreak: 5 });
	});

	it("does not count a cycle from 23:50 to 00:10 Lima and counts exactly 24 hours", () => {
		const startDate = Date.parse("2026-10-09T23:50:00-05:00");
		const twentyMinutesLater = Date.parse("2026-10-10T00:10:00-05:00");
		expect(twentyMinutesLater - startDate).toBe(20 * 60 * 1000);
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt: twentyMinutesLater,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBeNull();
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt: startDate + MS_PER_DAY,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toEqual({ currentStreak: 4, longestStreak: 5 });
		expect(
			streakAfterClose({
				isOpeningCycle: false,
				startDate,
				closeAt: startDate + MS_PER_DAY - 1,
				currentStreak: 3,
				longestStreak: 5,
				compliance: "compliant",
			}),
		).toBeNull();
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

	it("adds a habitual income on the opening cycle's Lima day and leaves the streak", () => {
		const laterSameDay = Date.parse("2026-10-09T23:50:00-05:00");
		expect(cycleStartedOnLimaDay(opening, laterSameDay)).toBe(true);
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt: laterSameDay,
				now: laterSameDay,
				incomeKind: "habitual",
			}),
		).toBe("opening");
		expect(
			streakAfterClose({
				isOpeningCycle: true,
				startDate,
				closeAt: laterSameDay,
				currentStreak: 4,
				longestStreak: 4,
				compliance: "failed",
			}),
		).toBeNull();
	});

	it("closes on a habitual income at any date, including 10 days before payday", () => {
		for (const occurredAt of [endDate - 10 * MS_PER_DAY, endDate - 3 * MS_PER_DAY, endDate]) {
			expect(
				resolveCycleForIncome({
					activeCycle: opening,
					occurredAt,
					now: occurredAt,
					incomeKind: "habitual",
				}),
			).toBeNull();
		}
		const carry = openingCarry();
		expect(carry).toEqual({ needs: 5_000, wants: 3_000, savings: 2_000, extraordinary: 0 });
		expect(envelopeWithCarry(5_000, carry.needs)).toEqual({
			allocatedAmount: 10_000,
			remainingAmount: 10_000,
			carriedOverCents: 5_000,
		});
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

	it("keeps an extraordinary income on payday and before the opening cycle", () => {
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt: endDate,
				now: endDate,
				incomeKind: "extraordinary",
			}),
		).toBe("opening");
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt: startDate - MS_PER_DAY,
				now: endDate,
				incomeKind: "extraordinary",
			}),
		).toBe("opening");
	});

	it("treats a missing income kind as habitual at any date", () => {
		expect(
			resolveCycleForIncome({
				activeCycle: opening,
				occurredAt: endDate - 10 * MS_PER_DAY,
				now: endDate - 10 * MS_PER_DAY,
				incomeKind: undefined,
			}),
		).toBeNull();
	});

	it("closes a regular cycle on a habitual income 10 days before the end", () => {
		expect(
			resolveCycleForIncome({
				activeCycle: { ...opening, isOpeningCycle: false },
				occurredAt: endDate - 10 * MS_PER_DAY,
				now: endDate - 10 * MS_PER_DAY,
				incomeKind: "habitual",
			}),
		).toBeNull();
	});
});
