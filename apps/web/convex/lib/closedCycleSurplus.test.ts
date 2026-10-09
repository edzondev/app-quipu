import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import {
	closedCycleSurplusBreakdown,
	closedCycleSurplusCents,
	dashboardClosedCycle,
	type LatestClosedCycleSlice,
	summaryClosedCycle,
} from "./closedCycleSurplus";
import { balancesAfterClosedCycleSurplusMove } from "./extraordinarySavingsSurplus";

const START = Date.UTC(2026, 7, 1);
const END = Date.UTC(2026, 7, 31);
const MOVED_AT = Date.UTC(2026, 8, 2);
const SURPLUS_CENTS = 18_450;

const closedNotMoved = {
	startDate: START,
	endDate: END,
} satisfies LatestClosedCycleSlice;

const closedMoved = {
	startDate: START,
	endDate: END,
	closeSurplusMovedAt: MOVED_AT,
} satisfies LatestClosedCycleSlice;

describe("dashboardClosedCycle", () => {
	it("returns null when the user has never closed a cycle", () => {
		expect(dashboardClosedCycle(null, SURPLUS_CENTS)).toBeNull();
	});

	it("returns the latest closed cycle with its surplus destined to the emergency fund", () => {
		expect(dashboardClosedCycle(closedNotMoved, SURPLUS_CENTS)).toEqual({
			startDate: START,
			endDate: END,
			surplusCents: SURPLUS_CENTS,
			surplusDestination: "emergency_fund",
			surplusMovedAt: null,
		});
	});

	it("keeps surplusMovedAt when the surplus was already moved", () => {
		expect(dashboardClosedCycle(closedMoved, SURPLUS_CENTS)).toEqual({
			startDate: START,
			endDate: END,
			surplusCents: SURPLUS_CENTS,
			surplusDestination: "emergency_fund",
			surplusMovedAt: MOVED_AT,
		});
	});

	it("returns closedCycle null while a cycle is active", () => {
		expect({ closedCycle: summaryClosedCycle(true, closedMoved, SURPLUS_CENTS) }).toEqual({
			closedCycle: null,
		});
	});
});

const OTHER_AT = Date.UTC(2026, 8, 3);
const NEEDS = 1_100;
const WANTS = 2_200;
const EXTRAORDINARY = 4_400;
const TOTAL = 7_700;
const REGULAR_SAVINGS = 5_000;

type ContributionSlice = Pick<
	Doc<"surplusContributions">,
	"amount" | "createdAt" | "contributionKind" | "fromEnvelope"
>;

const movedRows = [
	{ fromEnvelope: "needs", amount: NEEDS, createdAt: MOVED_AT, contributionKind: "additional" },
	{ fromEnvelope: "wants", amount: WANTS, createdAt: MOVED_AT, contributionKind: "additional" },
	{
		fromEnvelope: "extraordinary",
		amount: EXTRAORDINARY,
		createdAt: MOVED_AT,
		contributionKind: "additional",
	},
	{ fromEnvelope: "needs", amount: 99_000, createdAt: OTHER_AT, contributionKind: "additional" },
	{ fromEnvelope: "wants", amount: 77_000, createdAt: MOVED_AT, contributionKind: "objective" },
] satisfies ContributionSlice[];

describe("closedCycleSurplusBreakdown", () => {
	it("keeps the live split before the move and the contribution rows after", () => {
		const before = closedCycleSurplusBreakdown({
			closeSurplusMovedAt: undefined,
			needs: NEEDS,
			wants: WANTS,
			extraordinary: EXTRAORDINARY,
			surplusContributions: movedRows,
		});
		expect(before).toEqual({
			needs: NEEDS,
			wants: WANTS,
			extraordinary: EXTRAORDINARY,
			total: TOTAL,
		});
		expect(
			closedCycleSurplusCents({
				closeSurplusMovedAt: undefined,
				needs: NEEDS,
				wants: WANTS,
				extraordinary: EXTRAORDINARY,
				surplusContributions: movedRows,
			}),
		).toBe(TOTAL);

		const after = closedCycleSurplusBreakdown({
			closeSurplusMovedAt: MOVED_AT,
			needs: 0,
			wants: 0,
			extraordinary: 0,
			surplusContributions: movedRows,
		});
		expect(after).toEqual({
			needs: NEEDS,
			wants: WANTS,
			extraordinary: EXTRAORDINARY,
			total: TOTAL,
		});
		expect(after.needs + after.wants + after.extraordinary).toBe(after.total);

		const envelopes = balancesAfterClosedCycleSurplusMove(
			{
				needsRemainingCents: NEEDS,
				wantsRemainingCents: WANTS,
				savingsRemainingCents: EXTRAORDINARY + REGULAR_SAVINGS,
			},
			{ needsCents: NEEDS, wantsCents: WANTS, extraordinaryCents: EXTRAORDINARY },
		);
		expect(envelopes).toEqual({
			needsRemainingCents: 0,
			wantsRemainingCents: 0,
			savingsRemainingCents: REGULAR_SAVINGS,
		});
	});
});
