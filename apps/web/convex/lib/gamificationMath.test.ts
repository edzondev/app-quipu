import { describe, expect, it } from "vitest";
import {
	buildCycleChartBars,
	computeNextStreak,
	countConsecutiveWantsDiscipline,
	isRewardUnlocked,
} from "./gamificationMath";

describe("computeNextStreak", () => {
	it("increments on compliant and warning", () => {
		expect(computeNextStreak(2, 5, "compliant")).toEqual({
			currentStreak: 3,
			longestStreak: 5,
		});
		expect(computeNextStreak(2, 5, "warning")).toEqual({
			currentStreak: 3,
			longestStreak: 5,
		});
	});

	it("resets on failed without lowering longest", () => {
		expect(computeNextStreak(4, 7, "failed")).toEqual({
			currentStreak: 0,
			longestStreak: 7,
		});
	});

	it("updates longest when streak surpasses it", () => {
		expect(computeNextStreak(7, 7, "compliant")).toEqual({
			currentStreak: 8,
			longestStreak: 8,
		});
	});
});

describe("buildCycleChartBars", () => {
	it("pads to 12 slots and keeps chronological order", () => {
		const bars = buildCycleChartBars([
			{ status: "warning", evaluatedAt: 1 },
			{ status: "compliant", evaluatedAt: 2 },
		]);
		expect(bars).toHaveLength(12);
		expect(bars.filter((b) => b.status === "empty")).toHaveLength(10);
		expect(bars.at(-2)?.status).toBe("warning");
		expect(bars.at(-1)?.status).toBe("compliant");
	});
});

describe("countConsecutiveWantsDiscipline", () => {
	it("counts from most recent closed cycle", () => {
		expect(
			countConsecutiveWantsDiscipline([
				{ wantsWithinBudget: false, evaluatedAt: 1 },
				{ wantsWithinBudget: true, evaluatedAt: 2 },
				{ wantsWithinBudget: true, evaluatedAt: 3 },
			]),
		).toBe(2);
	});
});

describe("isRewardUnlocked", () => {
	it("uses current streak thresholds", () => {
		expect(isRewardUnlocked("tintaTheme", 2)).toBe(false);
		expect(isRewardUnlocked("tintaTheme", 3)).toBe(true);
		expect(isRewardUnlocked("annualReport", 11)).toBe(false);
		expect(isRewardUnlocked("annualReport", 12)).toBe(true);
	});
});
