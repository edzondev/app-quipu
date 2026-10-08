/**
 * Spendable money rules for Quipu.
 *
 * Spendable = needs remaining + wants remaining.
 * Excludes: active commitment reservations, savings envelope parked,
 * unallocated (must be assigned first), and already consumed movements
 * (already reflected in envelope remaining).
 */

export type SpendableSnapshotInput = {
	needsRemainingCents: number;
	wantsRemainingCents: number;
	savingsRemainingCents: number;
	unallocatedCents: number;
	activeReservedCents: number;
	daysRemaining: number;
};

export type SpendableSnapshot = {
	spendableCents: number;
	reservedCents: number;
	unallocatedCents: number;
	savingsParkedInEnvelopeCents: number;
	dailyAvailableCents: number;
};

export function computeSpendableCents(input: {
	needsRemainingCents: number;
	wantsRemainingCents: number;
}): number {
	return Math.max(0, input.needsRemainingCents) + Math.max(0, input.wantsRemainingCents);
}

export function computeDailyAvailableFromSpendable(
	spendableCents: number,
	daysRemaining: number,
): number {
	return Math.floor(Math.max(0, spendableCents) / Math.max(daysRemaining, 1));
}

export function computeSpendableSnapshot(input: SpendableSnapshotInput): SpendableSnapshot {
	const spendableCents = computeSpendableCents({
		needsRemainingCents: input.needsRemainingCents,
		wantsRemainingCents: input.wantsRemainingCents,
	});
	return {
		spendableCents,
		reservedCents: Math.max(0, input.activeReservedCents),
		unallocatedCents: Math.max(0, input.unallocatedCents),
		savingsParkedInEnvelopeCents: Math.max(0, input.savingsRemainingCents),
		dailyAvailableCents: computeDailyAvailableFromSpendable(spendableCents, input.daysRemaining),
	};
}
