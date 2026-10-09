export const SURPLUS_FROM_ENVELOPE_VALUES = ["needs", "wants", "extraordinary"] as const;

export type SurplusFromEnvelope = (typeof SURPLUS_FROM_ENVELOPE_VALUES)[number];

export type ExtraordinarySavingsIncomeSlice = {
	incomeKind?: "habitual" | "extraordinary";
	distributionApplied: { savings: number };
};

export type ExtraordinarySurplusContributionSlice = {
	fromEnvelope: SurplusFromEnvelope;
	amount: number;
};

export function sumExtraordinarySavingsAllocated(
	incomeEvents: ReadonlyArray<ExtraordinarySavingsIncomeSlice>,
): number {
	return incomeEvents.reduce((sum, event) => {
		if (event.incomeKind !== "extraordinary") return sum;
		return sum + Math.max(0, event.distributionApplied.savings);
	}, 0);
}

export function sumMovedFromExtraordinarySurplus(
	surplusContributions: ReadonlyArray<ExtraordinarySurplusContributionSlice>,
): number {
	return surplusContributions.reduce((sum, row) => {
		if (row.fromEnvelope !== "extraordinary") return sum;
		return sum + Math.max(0, row.amount);
	}, 0);
}

/** Pool still attributable to extraordinary income (before savings envelope cap). */
export function computeExtraordinarySavingsPoolCents(
	incomeEvents: ReadonlyArray<ExtraordinarySavingsIncomeSlice>,
	surplusContributions: ReadonlyArray<ExtraordinarySurplusContributionSlice>,
): number {
	const allocated = sumExtraordinarySavingsAllocated(incomeEvents);
	const moved = sumMovedFromExtraordinarySurplus(surplusContributions);
	return Math.max(0, allocated - moved);
}

/** Amount the user can move when source is "extraordinary" (pool capped by savings envelope remaining). */
export function computeAvailableExtraordinarySavingsForMove(input: {
	incomeEvents: ReadonlyArray<ExtraordinarySavingsIncomeSlice>;
	surplusContributions: ReadonlyArray<ExtraordinarySurplusContributionSlice>;
	savingsEnvelopeRemainingCents: number;
}): number {
	const pool = computeExtraordinarySavingsPoolCents(input.incomeEvents, input.surplusContributions);
	return Math.min(pool, Math.max(0, input.savingsEnvelopeRemainingCents));
}
