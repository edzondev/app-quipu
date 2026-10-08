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
	});
});
