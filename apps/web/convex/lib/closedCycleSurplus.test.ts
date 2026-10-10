import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import {
	closedCycleSurplusBreakdown,
	closedCycleSurplusCents,
	dashboardClosedCycle,
	movableEnvelopeCents,
	summaryClosedCycle,
} from "./closedCycleSurplus";

const START = Date.UTC(2026, 7, 1);
const END = Date.UTC(2026, 7, 31);
const MOVED_AT = Date.UTC(2026, 8, 2);
const SURPLUS_CENTS = 18_450;

const CYCLE_ID = "cycle-closed";

const closedNotMoved = {
	_id: CYCLE_ID,
	startDate: START,
	endDate: END,
};

const closedMoved = {
	_id: CYCLE_ID,
	startDate: START,
	endDate: END,
	closeSurplusMovedAt: MOVED_AT,
};

describe("dashboardClosedCycle", () => {
	it("returns null when the user has never closed a cycle", () => {
		expect(dashboardClosedCycle(null, SURPLUS_CENTS)).toBeNull();
	});

	it("returns the latest closed cycle and its surplus", () => {
		expect(dashboardClosedCycle(closedNotMoved, SURPLUS_CENTS)).toEqual({
			cycleId: CYCLE_ID,
			startDate: START,
			endDate: END,
			surplusCents: SURPLUS_CENTS,
			surplusMovedAt: null,
		});
	});

	it("keeps surplusMovedAt when the surplus was already moved", () => {
		expect(dashboardClosedCycle(closedMoved, SURPLUS_CENTS)).toEqual({
			cycleId: CYCLE_ID,
			startDate: START,
			endDate: END,
			surplusCents: SURPLUS_CENTS,
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

describe("movableEnvelopeCents", () => {
	it("keeps a fund move at zero when the envelope is negative or empty", () => {
		expect(movableEnvelopeCents(-100)).toBe(0);
		expect(movableEnvelopeCents(undefined)).toBe(0);
		expect(movableEnvelopeCents(50)).toBe(50);
	});
});

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
	});
});
