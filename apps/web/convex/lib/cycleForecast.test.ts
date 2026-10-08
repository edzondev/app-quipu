import { describe, expect, it } from "vitest";
import {
	buildCycleForecast,
	computeCloseProjectionCents,
	computeDaysUntilDepleted,
	computeEnvelopeBurnRate,
	MIN_CYCLE_DAYS_FOR_FORECAST,
} from "./cycleForecast";

const NOW = Date.UTC(2026, 6, 10, 12, 0, 0);

describe("computeEnvelopeBurnRate", () => {
	it("returns null when cycle day is below minimum", () => {
		expect(computeEnvelopeBurnRate(10_000, MIN_CYCLE_DAYS_FOR_FORECAST - 1)).toBe(null);
	});

	it("returns null when there are no expenses", () => {
		expect(computeEnvelopeBurnRate(0, 5)).toBe(null);
	});

	it("computes average daily spend", () => {
		expect(computeEnvelopeBurnRate(15_000, 5)).toBe(3_000);
	});
});

describe("computeDaysUntilDepleted", () => {
	it("returns 0 when already depleted", () => {
		expect(computeDaysUntilDepleted(0, 1_000)).toBe(0);
	});

	it("returns null when burn rate is zero", () => {
		expect(computeDaysUntilDepleted(5_000, 0)).toBe(null);
	});

	it("returns null when burn rate is unknown", () => {
		expect(computeDaysUntilDepleted(5_000, null)).toBe(null);
	});

	it("ceilings partial days", () => {
		expect(computeDaysUntilDepleted(5_000, 2_000)).toBe(3);
	});
});

describe("computeCloseProjectionCents", () => {
	it("returns null without burn rate", () => {
		expect(computeCloseProjectionCents(10_000, null, 10)).toBe(null);
	});

	it("projects surplus at cycle close", () => {
		expect(computeCloseProjectionCents(10_000, 500, 10)).toBe(5_000);
	});

	it("projects deficit at cycle close", () => {
		expect(computeCloseProjectionCents(10_000, 1_500, 10)).toBe(-5_000);
	});
});

describe("buildCycleForecast", () => {
	it("returns null when cycle day is below minimum", () => {
		expect(
			buildCycleForecast({
				cycleDay: 2,
				daysRemaining: 12,
				now: NOW,
				envelopes: [{ type: "wants", remainingAmount: 5_000, spentAmount: 1_000 }],
			}),
		).toBe(null);
	});

	it("builds per-envelope forecast with depletion day", () => {
		const result = buildCycleForecast({
			cycleDay: 5,
			daysRemaining: 10,
			now: NOW,
			envelopes: [
				{ type: "needs", remainingAmount: 20_000, spentAmount: 5_000 },
				{ type: "wants", remainingAmount: 6_000, spentAmount: 4_000 },
				{ type: "savings", remainingAmount: 10_000, spentAmount: 0 },
			],
		});

		expect(result).not.toBeNull();
		expect(result?.envelopes[1]?.daysUntilDepleted).toBe(8);
		expect(result?.earliestDepletion).toEqual({
			envelopeType: "wants",
			envelopeLabel: "Gustos",
			calendarDay: 18,
			daysUntilDepleted: 8,
		});
	});

	it("handles zero burn rate without depletion date", () => {
		const result = buildCycleForecast({
			cycleDay: 4,
			daysRemaining: 11,
			now: NOW,
			envelopes: [{ type: "wants", remainingAmount: 8_000, spentAmount: 0 }],
		});

		expect(result?.envelopes[0]?.burnRateCentsPerDay).toBe(null);
		expect(result?.envelopes[0]?.daysUntilDepleted).toBe(null);
		expect(result?.earliestDepletion).toBe(null);
	});

	it("marks already depleted envelopes as day zero", () => {
		const result = buildCycleForecast({
			cycleDay: 4,
			daysRemaining: 11,
			now: NOW,
			envelopes: [{ type: "wants", remainingAmount: 0, spentAmount: 12_000 }],
		});

		expect(result?.envelopes[0]?.daysUntilDepleted).toBe(0);
		expect(result?.earliestDepletion?.daysUntilDepleted).toBe(0);
	});
});
