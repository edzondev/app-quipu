import { applyDistributionPolicy, type DistributionPolicy } from "../../shared/lib/allocations";
import type { AllocationPlan } from "./incomeAllocation";

export type AllocationWeights = {
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
};

/**
 * Builds a full allocation plan on the server when the client does not send one
 * (e.g. income edit). Reservations are honored first; remainder follows policy.
 * Never invents savings contributions.
 */
export function buildDefaultAllocationPlan(input: {
	amountCents: number;
	weights: AllocationWeights;
	distributionPolicy?: DistributionPolicy;
	reservations?: AllocationPlan["reservations"];
	leaveUnallocatedCents?: number;
}): AllocationPlan {
	const reservations = (input.reservations ?? []).filter((row) => row.amountCents > 0);
	const reserved = reservations.reduce((sum, row) => sum + row.amountCents, 0);
	const leaveUnallocatedCents = Math.max(0, input.leaveUnallocatedCents ?? 0);
	const remainder = input.amountCents - reserved - leaveUnallocatedCents;
	if (remainder < 0) {
		throw new Error("La distribución supera el ingreso.");
	}

	const policy = input.distributionPolicy ?? "profile_default";
	const envelopes =
		remainder === 0
			? { needs: 0, wants: 0, savings: 0 }
			: applyDistributionPolicy(remainder, input.weights, policy);

	return {
		reservations,
		envelopes,
		savingsContributions: [],
		leaveUnallocatedCents,
	};
}
