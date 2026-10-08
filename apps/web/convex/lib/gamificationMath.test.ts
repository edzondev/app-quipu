import { describe, expect, it } from "vitest";
import {
	buildCycleChartBars,
	computeNextStreak,
	countConsecutiveWantsDiscipline,
	countDaysWithoutSkipping,
	isRewardUnlocked,
	readTimestampsForLoggingStreak,
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
		const july = Date.parse("2026-07-15T12:00:00-05:00");
		const august = Date.parse("2026-08-15T12:00:00-05:00");
		const bars = buildCycleChartBars([
			{ status: "warning", evaluatedAt: 1, cycleStart: july },
			{ status: "compliant", evaluatedAt: 2, cycleStart: august },
		]);
		expect(bars).toHaveLength(12);
		expect(bars.filter((b) => b.status === "empty")).toHaveLength(10);
		expect(bars.at(-2)?.status).toBe("warning");
		expect(bars.at(-2)?.id).toBe(1);
		expect(bars.at(-2)?.cycleStart).toBe(july);
		expect(bars.at(-2)?.monthLabel).toBe("Julio");
		expect(bars.at(-1)?.status).toBe("compliant");
		expect(bars.at(-1)?.cycleStart).toBe(august);
		expect(bars.at(-1)?.monthLabel).toBe("Agosto");
		expect(bars.at(0)?.cycleStart).toBeNull();
		expect(bars.at(0)?.monthLabel).toBeNull();
	});

	it("appends the open cycle with status current", () => {
		const september = Date.parse("2026-09-15T12:00:00-05:00");
		const bars = buildCycleChartBars(
			[
				{
					status: "compliant",
					evaluatedAt: 2,
					cycleStart: Date.parse("2026-08-15T12:00:00-05:00"),
				},
			],
			{ cycleStart: september },
		);
		const current = bars.at(-1);
		expect(bars).toHaveLength(12);
		expect(bars.filter((bar) => bar.status === "empty")).toHaveLength(10);
		expect(current?.status).toBe("current");
		expect(current?.id).toBe(september);
		expect(current?.cycleStart).toBe(september);
		expect(current?.monthLabel).toBe("Setiembre");
		expect(current?.heightPx).toBeGreaterThan(0);
	});

	it("omits the month when the closed cycle has no start date", () => {
		const bars = buildCycleChartBars([{ status: "failed", evaluatedAt: 5, cycleStart: null }]);
		expect(bars.at(-1)?.status).toBe("failed");
		expect(bars.at(-1)?.cycleStart).toBeNull();
		expect(bars.at(-1)?.monthLabel).toBeNull();
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

describe("countDaysWithoutSkipping", () => {
	const now = Date.parse("2026-10-08T15:00:00-05:00");

	it("counts consecutive Lima days backward from today", () => {
		expect(
			countDaysWithoutSkipping(
				[
					Date.parse("2026-10-08T09:00:00-05:00"),
					Date.parse("2026-10-07T09:00:00-05:00"),
					Date.parse("2026-10-06T23:00:00-05:00"),
				],
				now,
			),
		).toBe(3);
	});

	it("starts at yesterday when today has no expense yet", () => {
		expect(
			countDaysWithoutSkipping(
				[Date.parse("2026-10-07T09:00:00-05:00"), Date.parse("2026-10-06T09:00:00-05:00")],
				now,
			),
		).toBe(2);
	});

	it("is zero when today and yesterday are both empty", () => {
		expect(countDaysWithoutSkipping([Date.parse("2026-10-05T09:00:00-05:00")], now)).toBe(0);
	});

	it("counts a calendar day once and stops at the first gap", () => {
		expect(
			countDaysWithoutSkipping(
				[
					Date.parse("2026-10-08T08:00:00-05:00"),
					Date.parse("2026-10-08T21:00:00-05:00"),
					Date.parse("2026-10-06T08:00:00-05:00"),
				],
				now,
			),
		).toBe(1);
	});

	it("uses the Lima calendar instead of the UTC date", () => {
		const limaEveningThatIsNextUtcDay = Date.parse("2026-10-08T02:00:00Z");
		expect(
			countDaysWithoutSkipping(
				[Date.parse("2026-10-07T21:00:00-05:00")],
				limaEveningThatIsNextUtcDay,
			),
		).toBe(1);
	});

	it("crosses a month boundary", () => {
		expect(
			countDaysWithoutSkipping(
				[Date.parse("2026-10-01T10:00:00-05:00"), Date.parse("2026-09-30T10:00:00-05:00")],
				Date.parse("2026-10-01T18:00:00-05:00"),
			),
		).toBe(2);
	});
});

describe("readTimestampsForLoggingStreak", () => {
	const now = Date.parse("2026-10-08T15:00:00-05:00");

	it("stops at the first Lima day that breaks the streak", () => {
		const newestFirst = [
			Date.parse("2026-10-08T09:00:00-05:00"),
			Date.parse("2026-10-08T20:00:00-05:00"),
			Date.parse("2026-10-07T09:00:00-05:00"),
			Date.parse("2026-10-05T09:00:00-05:00"),
			Date.parse("2026-10-04T09:00:00-05:00"),
		];
		const read = readTimestampsForLoggingStreak(newestFirst, now);
		expect(read).toEqual(newestFirst.slice(0, 3));
		expect(countDaysWithoutSkipping(read, now)).toBe(2);
	});

	it("stops immediately when the newest expense is older than yesterday", () => {
		const newestFirst = [
			Date.parse("2026-10-05T09:00:00-05:00"),
			Date.parse("2026-10-04T09:00:00-05:00"),
		];
		expect(readTimestampsForLoggingStreak(newestFirst, now)).toEqual([]);
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
