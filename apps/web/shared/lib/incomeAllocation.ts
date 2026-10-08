/**
 * Shared allocation plan types + validation.
 * Convex and the income UI must use the same shapes so previews match persistence.
 */

export type SavingsContributionKind = "objective" | "additional";

export type EnvelopeAllocation = {
	needs: number;
	wants: number;
	savings: number;
};

export type AllocationReservation = {
	commitmentId: string;
	amountCents: number;
};

export type AllocationSavingsContribution = {
	amountCents: number;
	kind: SavingsContributionKind;
	subEnvelopeId?: string;
};

export type AllocationPlan = {
	reservations: AllocationReservation[];
	envelopes: EnvelopeAllocation;
	savingsContributions: AllocationSavingsContribution[];
	leaveUnallocatedCents: number;
};

export type AllocationBuckets = {
	reservedCents: number;
	envelopesCents: number;
	savingsContributionCents: number;
	unallocatedCents: number;
};

export function sumEnvelopeAllocation(envelopes: EnvelopeAllocation): number {
	return envelopes.needs + envelopes.wants + envelopes.savings;
}

export function summarizeAllocationPlan(plan: AllocationPlan): AllocationBuckets {
	return {
		reservedCents: plan.reservations.reduce((sum, row) => sum + row.amountCents, 0),
		envelopesCents: sumEnvelopeAllocation(plan.envelopes),
		savingsContributionCents: plan.savingsContributions.reduce(
			(sum, row) => sum + row.amountCents,
			0,
		),
		unallocatedCents: plan.leaveUnallocatedCents,
	};
}

export function assertNonNegativeCents(value: number, field: string): void {
	if (!Number.isInteger(value)) {
		throw new Error(`${field} debe ser céntimos enteros.`);
	}
	if (value < 0) {
		throw new Error(`${field} no puede ser negativo.`);
	}
}

export function assertAllocationBalances(
	amountCents: number,
	buckets: AllocationBuckets,
): { ok: true } | { ok: false; message: string } {
	try {
		assertNonNegativeCents(amountCents, "amountCents");
		for (const [key, value] of Object.entries(buckets) as Array<
			[keyof AllocationBuckets, number]
		>) {
			assertNonNegativeCents(value, key);
		}
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Monto inválido.",
		};
	}

	const sum =
		buckets.reservedCents +
		buckets.envelopesCents +
		buckets.savingsContributionCents +
		buckets.unallocatedCents;

	if (sum !== amountCents) {
		return {
			ok: false,
			message: `La distribución (${sum}) debe sumar exactamente el ingreso (${amountCents}).`,
		};
	}

	return { ok: true };
}

export function validateAllocationPlan(
	amountCents: number,
	plan: AllocationPlan,
): { ok: true; buckets: AllocationBuckets } | { ok: false; message: string } {
	for (const reservation of plan.reservations) {
		try {
			assertNonNegativeCents(reservation.amountCents, "reservation.amountCents");
		} catch (error) {
			return {
				ok: false,
				message: error instanceof Error ? error.message : "Reserva inválida.",
			};
		}
		if (!reservation.commitmentId) {
			return { ok: false, message: "Cada reserva necesita un compromiso." };
		}
	}

	for (const key of ["needs", "wants", "savings"] as const) {
		try {
			assertNonNegativeCents(plan.envelopes[key], `envelopes.${key}`);
		} catch (error) {
			return {
				ok: false,
				message: error instanceof Error ? error.message : "Sobre inválido.",
			};
		}
	}

	for (const contribution of plan.savingsContributions) {
		try {
			assertNonNegativeCents(contribution.amountCents, "savingsContribution.amountCents");
		} catch (error) {
			return {
				ok: false,
				message: error instanceof Error ? error.message : "Aporte inválido.",
			};
		}
		if (contribution.kind !== "objective" && contribution.kind !== "additional") {
			return { ok: false, message: "Tipo de aporte de ahorro inválido." };
		}
	}

	const buckets = summarizeAllocationPlan(plan);
	const balance = assertAllocationBalances(amountCents, buckets);
	if (!balance.ok) return balance;
	return { ok: true, buckets };
}
