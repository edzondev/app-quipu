import { describe, expect, it } from "vitest";
import {
	computeDailyAvailableCents,
	computeImpactPreview,
	computeIncomeDistribution,
	resolveCycleDaysForPreview,
	suggestHeldCentsForPreview,
} from "../impactPreview";

const WEIGHTS_50_30_20 = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

describe("computeIncomeDistribution", () => {
	it("distributes exactly the input amount", () => {
		const result = computeIncomeDistribution(90_000, WEIGHTS_50_30_20);
		expect(result.needs + result.wants + result.savings).toBe(90_000);
		expect(result).toEqual({ needs: 45_000, wants: 27_000, savings: 18_000 });
	});

	it("handles remainder cents with largest-remainder", () => {
		const result = computeIncomeDistribution(10_001, WEIGHTS_50_30_20);
		expect(result.needs + result.wants + result.savings).toBe(10_001);
	});
});

describe("computeImpactPreview", () => {
	it("returns null for zero amount", () => {
		expect(
			computeImpactPreview({
				amountCents: 0,
				weights: WEIGHTS_50_30_20,
				currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
				daysRemaining: 15,
			}),
		).toBeNull();
	});

	it("projects envelope deltas and daily available for new cycle", () => {
		const preview = computeImpactPreview({
			amountCents: 90_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
			daysRemaining: 15,
		});

		expect(preview).not.toBeNull();
		expect(preview?.distribution).toEqual({
			needs: 45_000,
			wants: 27_000,
			savings: 18_000,
		});
		expect(preview?.projectedEnvelopes.wants).toBe(27_000);
		expect(preview?.projectedDailyCents).toBe(computeDailyAvailableCents(27_000, 15));
		expect(preview?.currentDailyCents).toBe(0);
	});

	it("adds to existing envelope balances", () => {
		const preview = computeImpactPreview({
			amountCents: 10_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 50_000, wants: 30_000, savings: 20_000 },
			daysRemaining: 10,
		});

		expect(preview?.projectedEnvelopes).toEqual({
			needs: 55_000,
			wants: 33_000,
			savings: 22_000,
		});
		expect(preview?.projectedDailyCents).toBe(computeDailyAvailableCents(33_000, 10));
	});
});

describe("resolveCycleDaysForPreview", () => {
	it("uses 15 days for variable income model", () => {
		expect(
			resolveCycleDaysForPreview({
				incomeModel: "variable",
				payFrequency: null,
			}),
		).toBe(15);
	});

	it("maps pay frequency for fixed profiles", () => {
		expect(
			resolveCycleDaysForPreview({
				incomeModel: "fixed",
				payFrequency: "monthly",
			}),
		).toBe(30);
	});
});

describe("computeImpactPreview with heldCents (P3-4)", () => {
	it("distributes only the distributable portion when heldCents > 0", () => {
		const preview = computeImpactPreview({
			amountCents: 350_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
			daysRemaining: 15,
			heldCents: 250_000,
		});

		// distributable = 350_000 - 250_000 = 100_000
		expect(preview).not.toBeNull();
		expect(preview?.heldCents).toBe(250_000);
		expect(preview?.distributableCents).toBe(100_000);
		expect(preview).toBeTruthy();
		if (!preview) throw new Error("expected preview");
		const dist = preview.distribution;
		expect(dist.needs + dist.wants + dist.savings).toBe(100_000);
		expect(dist).toEqual({ needs: 50_000, wants: 30_000, savings: 20_000 });
	});

	it("totalIncomeReceived stays gross — envelope sum equals distributable, not gross", () => {
		const preview = computeImpactPreview({
			amountCents: 350_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
			daysRemaining: 15,
			heldCents: 250_000,
		});

		// Envelope deltas sum to distributableCents, not amountCents.
		const total =
			(preview?.distribution.needs ?? 0) +
			(preview?.distribution.wants ?? 0) +
			(preview?.distribution.savings ?? 0);
		expect(total).toBe(100_000);
		expect(total).not.toBe(350_000);
	});

	it("heldCents=0 behaves identically to omitting heldCents", () => {
		const withZero = computeImpactPreview({
			amountCents: 90_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
			daysRemaining: 15,
			heldCents: 0,
		});
		const withoutHeld = computeImpactPreview({
			amountCents: 90_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
			daysRemaining: 15,
		});

		expect(withZero?.distribution).toEqual(withoutHeld?.distribution);
		expect(withZero?.heldCents).toBe(0);
		expect(withZero?.distributableCents).toBe(90_000);
	});

	it("clamps heldCents to amountCents if exceeds", () => {
		const preview = computeImpactPreview({
			amountCents: 50_000,
			weights: WEIGHTS_50_30_20,
			currentEnvelopes: { needs: 0, wants: 0, savings: 0 },
			daysRemaining: 15,
			heldCents: 100_000, // exceeds amount
		});

		expect(preview?.heldCents).toBe(50_000);
		expect(preview?.distributableCents).toBe(0);
		expect(preview?.distribution).toEqual({ needs: 0, wants: 0, savings: 0 });
	});
});

describe("suggestHeldCentsForPreview (P3-4)", () => {
	it("returns min(amount, uncovered)", () => {
		expect(suggestHeldCentsForPreview(350_000, 250_000)).toBe(250_000);
	});

	it("caps at amount when uncovered exceeds amount", () => {
		expect(suggestHeldCentsForPreview(100_000, 500_000)).toBe(100_000);
	});

	it("returns 0 when uncovered is 0", () => {
		expect(suggestHeldCentsForPreview(350_000, 0)).toBe(0);
	});
});
