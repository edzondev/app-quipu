import { describe, expect, it } from "vitest";
import {
	allCommitmentsCovered,
	clampPercent,
	formatCycleDayLine,
	formatDueInDays,
	getInitial,
} from "../dashboard-math";

describe("dashboard UI math", () => {
	it("clamps percent values", () => {
		expect(clampPercent(120)).toBe(100);
		expect(clampPercent(-5)).toBe(0);
	});

	it("formats due in days copy", () => {
		expect(formatDueInDays(0)).toBe("hoy");
		expect(formatDueInDays(1)).toBe("en 1 día");
		expect(formatDueInDays(4)).toBe("en 4 días");
	});

	it("formats cycle day line", () => {
		expect(formatCycleDayLine(18, 30)).toBe("Día 18 de 30");
	});

	it("derives avatar initial", () => {
		expect(getInitial("Carlos")).toBe("C");
		expect(getInitial("")).toBe("Q");
	});

	it("detects when all commitments are covered", () => {
		expect(
			allCommitmentsCovered([{ coverageStatus: "covered" }, { coverageStatus: "covered" }]),
		).toBe(true);
		expect(allCommitmentsCovered([{ coverageStatus: "partial" }])).toBe(false);
	});
});
