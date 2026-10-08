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

function movableCents(amount: number): number | null {
	if (!Number.isInteger(amount) || amount <= 0) return null;
	return amount;
}

/**
 * Args de `savings.moveSurplusToSavings` salvo `toSubEnvelopeId` (lo agrega la query
 * si hay Fondo). Solo cuando un único origen tiene céntimos enteros positivos.
 * Varios orígenes no tienen un `fromEnvelope` único en el schema.
 */
export function resolveSurplusMove(input: {
	needsRemainingCents: number;
	wantsRemainingCents: number;
	extraordinaryAvailableCents: number;
}) {
	const available: Array<{ fromEnvelope: SurplusFromEnvelope; amount: number }> = [];
	const needs = movableCents(input.needsRemainingCents);
	const wants = movableCents(input.wantsRemainingCents);
	const extraordinary = movableCents(input.extraordinaryAvailableCents);
	if (needs !== null) available.push({ fromEnvelope: "needs", amount: needs });
	if (wants !== null) available.push({ fromEnvelope: "wants", amount: wants });
	if (extraordinary !== null) {
		available.push({ fromEnvelope: "extraordinary", amount: extraordinary });
	}
	if (available.length !== 1) return null;
	const only = available[0];
	if (only === undefined) return null;
	return { fromEnvelope: only.fromEnvelope, amount: only.amount };
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
