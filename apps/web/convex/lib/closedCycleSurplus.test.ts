import { describe, expect, it } from "vitest";
import { dashboardClosedCycle, type LatestClosedCycleSlice } from "./closedCycleSurplus";

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
});
