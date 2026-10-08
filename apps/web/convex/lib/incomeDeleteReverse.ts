import type { Id } from "../_generated/dataModel";

export type AllocationLineForReverse = {
	destination:
		| "envelope_needs"
		| "envelope_wants"
		| "envelope_savings"
		| "commitment_reservation"
		| "savings_contribution"
		| "unallocated";
	amountCents: number;
	reservationId?: Id<"commitmentReservations">;
	subEnvelopeId?: Id<"subEnvelopes">;
	contributionKind?: "objective" | "additional";
};

export type IncomeDeleteReversePlan = {
	unallocatedDeltaCents: number;
	reservationIdsToRelease: Id<"commitmentReservations">[];
	subEnvelopeReversals: Array<{
		subEnvelopeId: Id<"subEnvelopes">;
		amountCents: number;
	}>;
	surplusContributionKinds: Array<"objective" | "additional">;
};

/**
 * Plans ledger side-effects when deleting an income event.
 * Envelope reverse still uses distributionApplied on the event itself.
 */
export function planIncomeDeleteLedgerReverse(
	lines: ReadonlyArray<AllocationLineForReverse>,
): IncomeDeleteReversePlan {
	let unallocatedDeltaCents = 0;
	const reservationIdsToRelease: Id<"commitmentReservations">[] = [];
	const subEnvelopeMap = new Map<Id<"subEnvelopes">, number>();
	const surplusContributionKinds: Array<"objective" | "additional"> = [];

	for (const line of lines) {
		const amount = Math.max(0, line.amountCents);
		if (amount <= 0) continue;

		if (line.destination === "unallocated") {
			unallocatedDeltaCents += amount;
			continue;
		}

		if (line.destination === "commitment_reservation" && line.reservationId) {
			reservationIdsToRelease.push(line.reservationId);
			continue;
		}

		if (line.destination === "savings_contribution" && line.subEnvelopeId) {
			const prev = subEnvelopeMap.get(line.subEnvelopeId) ?? 0;
			subEnvelopeMap.set(line.subEnvelopeId, prev + amount);
			if (line.contributionKind === "additional") {
				surplusContributionKinds.push("additional");
			} else if (line.contributionKind === "objective") {
				surplusContributionKinds.push("objective");
			}
		}
	}

	return {
		unallocatedDeltaCents,
		reservationIdsToRelease,
		subEnvelopeReversals: [...subEnvelopeMap.entries()].map(([subEnvelopeId, amountCents]) => ({
			subEnvelopeId,
			amountCents,
		})),
		surplusContributionKinds,
	};
}
