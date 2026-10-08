import { type AllocationPlan, validateAllocationPlan } from "../../shared/lib/incomeAllocation";

export type {
	AllocationPlan,
	SavingsContributionKind,
} from "../../shared/lib/incomeAllocation";

export type AllocationApplyResult = {
	distributionApplied: {
		needs: number;
		wants: number;
		savings: number;
	};
	heldFromReservationsCents: number;
	totals: {
		reservedCents: number;
		envelopesCents: number;
		objectiveContributionCents: number;
		additionalContributionCents: number;
		unallocatedCents: number;
	};
};

export function buildAllocationApplyResult(input: {
	amountCents: number;
	plan: AllocationPlan;
}): AllocationApplyResult {
	const validated = validateAllocationPlan(input.amountCents, input.plan);
	if (!validated.ok) {
		throw new Error(validated.message);
	}

	const { buckets } = validated;
	const objectiveContributionCents = input.plan.savingsContributions
		.filter((row) => row.kind === "objective")
		.reduce((sum, row) => sum + row.amountCents, 0);
	const additionalContributionCents = input.plan.savingsContributions
		.filter((row) => row.kind === "additional")
		.reduce((sum, row) => sum + row.amountCents, 0);

	return {
		distributionApplied: { ...input.plan.envelopes },
		heldFromReservationsCents: buckets.reservedCents,
		totals: {
			reservedCents: buckets.reservedCents,
			envelopesCents: buckets.envelopesCents,
			objectiveContributionCents,
			additionalContributionCents,
			unallocatedCents: buckets.unallocatedCents,
		},
	};
}

/** Default plan: put everything in unallocated (safe; nothing invented as savings). */
export function defaultUnallocatedPlan(amountCents: number): AllocationPlan {
	return {
		reservations: [],
		envelopes: { needs: 0, wants: 0, savings: 0 },
		savingsContributions: [],
		leaveUnallocatedCents: amountCents,
	};
}
