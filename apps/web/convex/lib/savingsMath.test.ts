import { describe, expect, it } from "vitest";
import {
	buildMonthsCoveredCopy,
	computeCyclesToComplete,
	computeEmergencyFundTargetCents,
	computeMonthlyEssentialsCents,
	computeMonthsCovered,
	computeProgressPercent,
	computeRemainingToTarget,
	resolveEmergencyFundTargetCents,
} from "./savingsMath";

describe("computeMonthlyEssentialsCents", () => {
	it("sums needs commitments when present", () => {
		expect(computeMonthlyEssentialsCents([{ amount: 120000 }, { amount: 80000 }], 50000)).toBe(
			200000,
		);
	});

	it("falls back to cycle needs allocation when no commitments", () => {
		expect(computeMonthlyEssentialsCents([], 150000)).toBe(150000);
	});
});

describe("computeEmergencyFundTargetCents", () => {
	it("multiplies monthly essentials by three months", () => {
		expect(computeEmergencyFundTargetCents(350000)).toBe(1050000);
	});
});

describe("computeMonthsCovered", () => {
	it("returns fractional months covered", () => {
		expect(computeMonthsCovered(420000, 350000)).toBeCloseTo(1.2);
	});

	it("returns 0 when monthly essentials is zero", () => {
		expect(computeMonthsCovered(10000, 0)).toBe(0);
	});
});

describe("computeProgressPercent", () => {
	it("caps at 100", () => {
		expect(computeProgressPercent(1200000, 1050000)).toBe(100);
	});

	it("rounds to whole percent", () => {
		expect(computeProgressPercent(420000, 1050000)).toBe(40);
	});
});

describe("computeRemainingToTarget", () => {
	it("never returns negative remaining", () => {
		expect(computeRemainingToTarget(1200000, 1050000)).toBe(0);
	});
});

describe("computeCyclesToComplete", () => {
	it("returns null when cycle contribution is zero", () => {
		expect(computeCyclesToComplete(500000, 0)).toBeNull();
	});

	it("ceil-divides remaining by cycle contribution", () => {
		expect(computeCyclesToComplete(630000, 70000)).toBe(9);
	});
});

describe("buildMonthsCoveredCopy", () => {
	it("uses vas seguro when halfway covered", () => {
		expect(buildMonthsCoveredCopy(1.2)).toBe("1.2 de 3 meses cubiertos · vas seguro");
	});

	it("marks meta alcanzada at target months", () => {
		expect(buildMonthsCoveredCopy(3)).toBe("3 de 3 meses cubiertos · meta alcanzada");
	});
});

describe("resolveEmergencyFundTargetCents", () => {
	it("prefers stored target when set", () => {
		expect(resolveEmergencyFundTargetCents(900000, 1050000)).toBe(900000);
	});

	it("uses computed target when stored is missing", () => {
		expect(resolveEmergencyFundTargetCents(undefined, 1050000)).toBe(1050000);
	});
});
