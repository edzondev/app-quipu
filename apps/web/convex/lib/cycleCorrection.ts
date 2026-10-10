import { assertNonNegativeCents } from "./moneyInvariant";

export type CycleCorrectionPlan = {
	reserveToCommitments: Array<{ commitmentId: string; amountCents: number }>;
	setEnvelopeRemaining: { needs: number; wants: number; savings: number };
	contributeToSavings: Array<{
		amountCents: number;
		kind: "objective" | "additional";
		subEnvelopeId?: string;
	}>;
	setUnallocatedCents: number;
	/**
	 * Bank cash that must be represented by the correction targets
	 * (sobres + reservado + por repartir + aportes que salen del líquido).
	 * When set, a liquidity_reconciliation transfer absorbs the gap vs Quipu.
	 */
	declaredLiquidCents?: number;
	note?: string;
};

export type CycleCorrectionSnapshot = {
	needsRemaining: number;
	wantsRemaining: number;
	savingsRemaining: number;
	unallocatedCents: number;
	activeReservedCents: number;
};

export type InternalTransferDraft = {
	kind:
		| "cycle_correction"
		| "reservation_from_envelope"
		| "unallocated_to_envelope"
		| "unallocated_to_reservation"
		| "unallocated_to_savings"
		| "envelope_rebalance"
		| "savings_to_unallocated"
		| "liquidity_reconciliation";
	amountCents: number;
	from: string;
	to: string;
};

/**
 * Liquid total that must be conserved by a correction (excluding Fondo which
 * may increase when user confirms contributions from liquid pots).
 */
export function computeLiquidTotal(snapshot: CycleCorrectionSnapshot): number {
	return (
		Math.max(0, snapshot.needsRemaining) +
		Math.max(0, snapshot.wantsRemaining) +
		Math.max(0, snapshot.savingsRemaining) +
		Math.max(0, snapshot.unallocatedCents) +
		Math.max(0, snapshot.activeReservedCents)
	);
}

export function buildCycleCorrectionTransfers(input: {
	before: CycleCorrectionSnapshot;
	plan: CycleCorrectionPlan;
}): {
	transfers: InternalTransferDraft[];
	after: CycleCorrectionSnapshot;
	contributionCents: number;
	reconciliationDeltaCents: number;
	conservedLiquidMinusContributions: boolean;
} {
	for (const key of ["needs", "wants", "savings"] as const) {
		assertNonNegativeCents(input.plan.setEnvelopeRemaining[key], `setEnvelopeRemaining.${key}`);
	}
	assertNonNegativeCents(input.plan.setUnallocatedCents, "setUnallocatedCents");
	for (const row of input.plan.reserveToCommitments) {
		assertNonNegativeCents(row.amountCents, "reserveToCommitments.amountCents");
	}
	for (const row of input.plan.contributeToSavings) {
		assertNonNegativeCents(row.amountCents, "contributeToSavings.amountCents");
	}
	if (input.plan.declaredLiquidCents !== undefined) {
		assertNonNegativeCents(input.plan.declaredLiquidCents, "declaredLiquidCents");
	}

	const newReserved = input.plan.reserveToCommitments.reduce(
		(sum, row) => sum + row.amountCents,
		0,
	);
	const contributionCents = input.plan.contributeToSavings.reduce(
		(sum, row) => sum + row.amountCents,
		0,
	);

	const after: CycleCorrectionSnapshot = {
		needsRemaining: input.plan.setEnvelopeRemaining.needs,
		wantsRemaining: input.plan.setEnvelopeRemaining.wants,
		savingsRemaining: input.plan.setEnvelopeRemaining.savings,
		unallocatedCents: input.plan.setUnallocatedCents,
		activeReservedCents: newReserved,
	};

	const beforeLiquid = computeLiquidTotal(input.before);
	const afterLiquid = computeLiquidTotal(after);
	const targetLiquidPlusContributions = afterLiquid + contributionCents;

	let reconciliationDeltaCents = 0;
	if (input.plan.declaredLiquidCents !== undefined) {
		if (input.plan.declaredLiquidCents !== targetLiquidPlusContributions) {
			throw new Error(
				`El saldo bancario declarado (${input.plan.declaredLiquidCents}) debe coincidir con sobres + reservado + por repartir + aportes (${targetLiquidPlusContributions}).`,
			);
		}
		reconciliationDeltaCents = input.plan.declaredLiquidCents - beforeLiquid;
	}

	const conservedLiquidMinusContributions =
		beforeLiquid + reconciliationDeltaCents === afterLiquid + contributionCents;

	const transfers: InternalTransferDraft[] = [];

	if (reconciliationDeltaCents > 0) {
		transfers.push({
			kind: "liquidity_reconciliation",
			amountCents: reconciliationDeltaCents,
			from: "bank:reconciliation",
			to: "correction:pool",
		});
	} else if (reconciliationDeltaCents < 0) {
		transfers.push({
			kind: "liquidity_reconciliation",
			amountCents: -reconciliationDeltaCents,
			from: "correction:pool",
			to: "bank:reconciliation",
		});
	}

	const pushDelta = (account: string, beforeCents: number, afterCents: number) => {
		const delta = afterCents - beforeCents;
		if (delta === 0) return;
		if (delta > 0) {
			transfers.push({
				kind: "cycle_correction",
				amountCents: delta,
				from: "correction:pool",
				to: account,
			});
		} else {
			transfers.push({
				kind: "cycle_correction",
				amountCents: -delta,
				from: account,
				to: "correction:pool",
			});
		}
	};

	pushDelta("envelope:needs", input.before.needsRemaining, after.needsRemaining);
	pushDelta("envelope:wants", input.before.wantsRemaining, after.wantsRemaining);
	pushDelta("envelope:savings", input.before.savingsRemaining, after.savingsRemaining);
	pushDelta("unallocated", input.before.unallocatedCents, after.unallocatedCents);
	pushDelta("reservations", input.before.activeReservedCents, after.activeReservedCents);

	if (contributionCents > 0) {
		transfers.push({
			kind: "unallocated_to_savings",
			amountCents: contributionCents,
			from: "correction:pool",
			to: "subEnvelope:contribution",
		});
	}

	return {
		transfers,
		after,
		contributionCents,
		reconciliationDeltaCents,
		conservedLiquidMinusContributions,
	};
}

/**
 * Correction restates the envelope as spent + the new remaining.
 * That pair is no longer "income + carry", so the old carry must not stay.
 */
export function envelopeAmountsAfterCorrection(input: {
	allocatedAmount: number;
	remainingAmount: number;
	targetRemaining: number;
}) {
	const spent = Math.max(0, input.allocatedAmount - input.remainingAmount);
	return {
		remainingAmount: input.targetRemaining,
		allocatedAmount: spent + input.targetRemaining,
		carriedOverCents: 0,
	};
}
