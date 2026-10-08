import { describe, expect, it } from "vitest";
import {
	buildCycleContributionSubtitle,
	formatCyclesToCompleteLabel,
	parseOptionalTargetCents,
} from "../savingsCopy";

describe("buildCycleContributionSubtitle", () => {
	it("returns null without active cycle", () => {
		expect(buildCycleContributionSubtitle(70000, false)).toBeNull();
	});

	it("returns marker when cycle contribution exists", () => {
		expect(buildCycleContributionSubtitle(70000, true)).toBe("cycle-active");
	});
});

describe("formatCyclesToCompleteLabel", () => {
	it("formats approximate cycles", () => {
		expect(formatCyclesToCompleteLabel(9)).toBe("~9 ciclos");
	});

	it("returns dash when contribution is unknown", () => {
		expect(formatCyclesToCompleteLabel(null)).toBe("—");
	});
});

describe("parseOptionalTargetCents", () => {
	it("parses soles input to cents", () => {
		expect(parseOptionalTargetCents("3000")).toBe(300000);
	});

	it("returns undefined for empty input", () => {
		expect(parseOptionalTargetCents("")).toBeUndefined();
	});
});
