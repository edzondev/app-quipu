/**
 * Spendable money rules for Quipu.
 *
 * Spendable = max(0, needs remaining + wants remaining).
 * Signed sum of the needs and wants envelopes, clamped to zero once at the end.
 * Reservations live in another bucket, already outside the envelopes.
 * Savings parked and unallocated are not spendable (unallocated must be assigned
 * first). Already consumed movements are already reflected in envelope remaining.
 *
 * Envelope overspend is max(0, −remaining) per envelope
 * (needsOverspentCents / wantsOverspentCents).
 */

import { type Infer, v } from "convex/values";

export const spendableSnapshotValidator = v.object({
	spendableCents: v.number(),
	reservedCents: v.number(),
	unallocatedCents: v.number(),
	savingsParkedInEnvelopeCents: v.number(),
	dailyAvailableCents: v.number(),
	needsOverspentCents: v.number(),
	wantsOverspentCents: v.number(),
});

export type SpendableSnapshotInput = {
	needsRemainingCents: number;
	wantsRemainingCents: number;
	savingsRemainingCents: number;
	unallocatedCents: number;
	activeReservedCents: number;
	daysRemaining: number;
};

export type SpendableSnapshot = Infer<typeof spendableSnapshotValidator>;

export function computeSpendableCents(input: {
	needsRemainingCents: number;
	wantsRemainingCents: number;
}): number {
	return Math.max(0, input.needsRemainingCents + input.wantsRemainingCents);
}

export function computeEnvelopeOverspentCents(remainingCents: number): number {
	return Math.max(0, -remainingCents);
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
		needsOverspentCents: computeEnvelopeOverspentCents(input.needsRemainingCents),
		wantsOverspentCents: computeEnvelopeOverspentCents(input.wantsRemainingCents),
	};
}
