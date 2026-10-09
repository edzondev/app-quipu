import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import {
	closedCycleSurplusCents,
	dashboardClosedCycle,
	type LatestClosedCycleSlice,
	summaryClosedCycle,
} from "./closedCycleSurplus";

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

type ContributionSlice = Pick<
	Doc<"surplusContributions">,
	"amount" | "createdAt" | "contributionKind"
>;

const movedContributions = [
	{ amount: 2_000, createdAt: MOVED_AT, contributionKind: "additional" },
	{ amount: 3_000, createdAt: MOVED_AT, contributionKind: "additional" },
	{ amount: 8_500, createdAt: MOVED_AT, contributionKind: "additional" },
	{ amount: 99_000, createdAt: OTHER_AT, contributionKind: "additional" },
	{ amount: 77_000, createdAt: MOVED_AT, contributionKind: "objective" },
] satisfies ContributionSlice[];

describe("closedCycleSurplusCents", () => {
	it("movido con extraordinario > 0", () => {
		expect(
			closedCycleSurplusCents({
				closeSurplusMovedAt: undefined,
				needs: 1_100,
				wants: 2_200,
				extraordinary: 4_400,
				surplusContributions: movedContributions,
			}),
		).toBe(7_700);
		expect(
			closedCycleSurplusCents({
				closeSurplusMovedAt: MOVED_AT,
				needs: 2_000,
				wants: 3_000,
				extraordinary: 0,
				surplusContributions: movedContributions,
			}),
		).toBe(13_500);
	});
});
