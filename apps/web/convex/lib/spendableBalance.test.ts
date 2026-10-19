import { describe, expect, it } from "vitest";
import {
	computeDailyAvailableFromSpendable,
	computeSpendableCents,
	computeSpendableSnapshot,
} from "./spendableBalance";

describe("spendableBalance", () => {
	it("spendable is needs + wants only", () => {
		expect(
			computeSpendableCents({
				needsRemainingCents: 80_00,
				wantsRemainingCents: 20_00,
			}),
		).toBe(100_00);
	});

	it("daily available uses spendable and days remaining", () => {
		expect(computeDailyAvailableFromSpendable(100_00, 10)).toBe(10_00);
		expect(computeDailyAvailableFromSpendable(100_00, 0)).toBe(100_00);
	});

	it("snapshot excludes reserved, unallocated, and savings parked", () => {
		const snap = computeSpendableSnapshot({
			needsRemainingCents: 50_00,
			wantsRemainingCents: 50_00,
			savingsRemainingCents: 99_080,
			unallocatedCents: 5_237,
			activeReservedCents: 250_000,
			daysRemaining: 10,
		});
		expect(snap.spendableCents).toBe(100_00);
		expect(snap.reservedCents).toBe(250_000);
		expect(snap.unallocatedCents).toBe(5_237);
		expect(snap.savingsParkedInEnvelopeCents).toBe(99_080);
		expect(snap.dailyAvailableCents).toBe(10_00);
		expect(snap.needsOverspentCents).toBe(0);
		expect(snap.wantsOverspentCents).toBe(0);
	});

	it("clamps the signed needs+wants sum once, so one overspent envelope reduces the other", () => {
		// Edzon: needs −S/ 474.67, wants S/ 319.72. Old formula hid the needs
		// deficit and reported S/ 319.72 spendable.
		const snap = computeSpendableSnapshot({
			needsRemainingCents: -47_467,
			wantsRemainingCents: 31_972,
			savingsRemainingCents: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
			daysRemaining: 10,
		});
		expect(snap.spendableCents).toBe(0);
		expect(snap.dailyAvailableCents).toBe(0);
		expect(snap.needsOverspentCents).toBe(47_467);
		expect(snap.wantsOverspentCents).toBe(0);
	});

	it("keeps daily available identical to the old formula when neither envelope is negative", () => {
		const snap = computeSpendableSnapshot({
			needsRemainingCents: 40_000,
			wantsRemainingCents: 10_000,
			savingsRemainingCents: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
			daysRemaining: 10,
		});
		expect(snap.spendableCents).toBe(50_000);
		expect(snap.dailyAvailableCents).toBe(5_000);
		expect(snap.needsOverspentCents).toBe(0);
		expect(snap.wantsOverspentCents).toBe(0);
	});

	it("lets a smaller needs deficit reduce wants, and reports that overspend", () => {
		const snap = computeSpendableSnapshot({
			needsRemainingCents: -10_000,
			wantsRemainingCents: 50_000,
			savingsRemainingCents: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
			daysRemaining: 10,
		});
		expect(snap.spendableCents).toBe(40_000);
		expect(snap.dailyAvailableCents).toBe(4_000);
		expect(snap.needsOverspentCents).toBe(10_000);
		expect(snap.wantsOverspentCents).toBe(0);
	});

	it("reports both overspends and zero spendable when both envelopes are negative", () => {
		const snap = computeSpendableSnapshot({
			needsRemainingCents: -5_000,
			wantsRemainingCents: -3_000,
			savingsRemainingCents: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
			daysRemaining: 10,
		});
		expect(snap.spendableCents).toBe(0);
		expect(snap.dailyAvailableCents).toBe(0);
		expect(snap.needsOverspentCents).toBe(5_000);
		expect(snap.wantsOverspentCents).toBe(3_000);
	});

	it("returns zeros when both envelopes are empty", () => {
		const snap = computeSpendableSnapshot({
			needsRemainingCents: 0,
			wantsRemainingCents: 0,
			savingsRemainingCents: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
			daysRemaining: 10,
		});
		expect(snap.spendableCents).toBe(0);
		expect(snap.dailyAvailableCents).toBe(0);
		expect(snap.needsOverspentCents).toBe(0);
		expect(snap.wantsOverspentCents).toBe(0);
	});
});
