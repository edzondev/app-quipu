import { daysUntilNextDue, isPastNextDue, resolveCommitmentNextDueAt } from "./commitmentDueDate";

export type CommitmentSlice = {
	id: string;
	amount: number;
	envelope: "needs" | "wants";
	dueDay: number;
	nextDueAt?: number;
	createdAt?: number;
};

export type CycleSlice = {
	startDate: number;
	endDate: number;
};

export type IncomeEventSlice = {
	id: string;
	occurredAt: number;
	distributionApplied: {
		needs: number;
		wants: number;
		savings: number;
	};
};

/** Active reservation remaining for a specific commitment (ledger truth). */
export type ReservationCoverageSlice = {
	commitmentId: string;
	activeCents: number;
	incomeEventId?: string;
};

export type FundingEvent = {
	eventId: string;
	amount: number;
};

/**
 * La cobertura mezcla ingresos reales con fuentes virtuales (`__boost_*`, `__reservation_*`,
 * `__carry_*`). Todas empiezan con `__`; un id de Convex nunca lo hace. Así una fuente virtual
 * nueva no se cuela en `coveredBy`, que solo acepta `incomeEvents` reales.
 */
export function isVirtualFundingId(eventId: string): boolean {
	return eventId.startsWith("__");
}

export type CommitmentCoverageStatus = "covered" | "partial" | "not-started" | "overdue";

export type CommitmentCoverageResult = {
	covered: number;
	remaining: number;
	fundingEvents: FundingEvent[];
	status: CommitmentCoverageStatus;
};

export type DashboardCoverageStatus = "covered" | "partial" | "uncovered";

function resolveCoverageNextDueAt(commitment: CommitmentSlice, now: number): number {
	return resolveCommitmentNextDueAt({
		dueDay: commitment.dueDay,
		nextDueAt: commitment.nextDueAt,
		createdAt: commitment.createdAt ?? now,
	});
}

export function resolveCommitmentCoverageStatus(params: {
	covered: number;
	remaining: number;
	nextDueAt: number;
	now: number;
}): CommitmentCoverageStatus {
	const { covered, remaining, nextDueAt, now } = params;

	if (remaining <= 0) return "covered";
	if (isPastNextDue(nextDueAt, now)) return "overdue";
	if (covered > 0) return "partial";
	return "not-started";
}

export function mapCoverageStatusToDashboard(
	status: CommitmentCoverageStatus,
): DashboardCoverageStatus {
	switch (status) {
		case "covered":
			return "covered";
		case "partial":
			return "partial";
		case "not-started":
		case "overdue":
			return "uncovered";
	}
}

function filterIncomeEventsInCycle(
	incomeEvents: IncomeEventSlice[],
	cycle: CycleSlice,
): IncomeEventSlice[] {
	return incomeEvents
		.filter((event) => event.occurredAt >= cycle.startDate && event.occurredAt < cycle.endDate)
		.sort((a, b) => a.occurredAt - b.occurredAt);
}

export type CoverageBoost = {
	needs: number;
	wants: number;
};

export function computeAllCommitmentCoverage(params: {
	commitments: CommitmentSlice[];
	cycle: CycleSlice;
	incomeEvents: IncomeEventSlice[];
	now: number;
	coverageBoost?: CoverageBoost;
	excludedCommitmentIds?: ReadonlySet<string>;
	/** Active reservation cents per commitment (replaces legacy heldCents pool). */
	reservations?: ReservationCoverageSlice[];
}): Map<string, CommitmentCoverageResult> {
	const {
		commitments,
		cycle,
		incomeEvents,
		now,
		coverageBoost,
		excludedCommitmentIds,
		reservations = [],
	} = params;
	const results = new Map<string, CommitmentCoverageResult>();
	const eventsInWindow = filterIncomeEventsInCycle(incomeEvents, cycle);
	const activeCommitments = commitments.filter(
		(commitment) => !excludedCommitmentIds?.has(commitment.id),
	);

	for (const commitment of commitments) {
		if (excludedCommitmentIds?.has(commitment.id)) {
			results.set(commitment.id, {
				covered: 0,
				remaining: 0,
				fundingEvents: [],
				status: "covered",
			});
		}
	}

	// Drainable active reservation pool per commitment.
	const reservationPool = new Map<string, number>();
	for (const row of reservations) {
		if (row.activeCents <= 0) continue;
		reservationPool.set(
			row.commitmentId,
			(reservationPool.get(row.commitmentId) ?? 0) + row.activeCents,
		);
	}

	for (const envelope of ["needs", "wants"] as const) {
		const eventRemaining = new Map<string, number>();

		for (const event of eventsInWindow) {
			const allocation = event.distributionApplied[envelope];
			if (allocation > 0) {
				eventRemaining.set(event.id, allocation);
			}
		}

		const boostAmount = coverageBoost?.[envelope] ?? 0;
		if (boostAmount > 0) {
			eventRemaining.set(`__boost_${envelope}__`, boostAmount);
		}

		const envelopeCommitments = activeCommitments
			.filter((commitment) => commitment.envelope === envelope)
			.sort((a, b) => {
				const dueDiff = a.dueDay - b.dueDay;
				if (dueDiff !== 0) return dueDiff;
				return a.id.localeCompare(b.id);
			});

		for (const commitment of envelopeCommitments) {
			let covered = 0;
			const fundingEvents: FundingEvent[] = [];
			let need = commitment.amount;

			// First: ledger reservations earmarked for this commitment.
			const reservedAvailable = reservationPool.get(commitment.id) ?? 0;
			if (reservedAvailable > 0 && need > 0) {
				const allocated = Math.min(need, reservedAvailable);
				covered += allocated;
				need -= allocated;
				reservationPool.set(commitment.id, reservedAvailable - allocated);
				fundingEvents.push({
					eventId: `__reservation_${commitment.id}__`,
					amount: allocated,
				});
			}

			// Then drain per-envelope distributionApplied (+ boost).
			for (const [eventId, available] of eventRemaining) {
				if (need <= 0) break;
				if (available <= 0) continue;

				const allocated = Math.min(need, available);
				covered += allocated;
				need -= allocated;
				eventRemaining.set(eventId, available - allocated);
				fundingEvents.push({ eventId, amount: allocated });
			}

			const remaining = commitment.amount - covered;
			const nextDueAt = resolveCoverageNextDueAt(commitment, now);
			results.set(commitment.id, {
				covered,
				remaining,
				fundingEvents,
				status: resolveCommitmentCoverageStatus({
					covered,
					remaining,
					nextDueAt,
					now,
				}),
			});
		}
	}

	for (const commitment of activeCommitments) {
		if (results.has(commitment.id)) continue;

		results.set(commitment.id, {
			covered: 0,
			remaining: commitment.amount,
			fundingEvents: [],
			status: resolveCommitmentCoverageStatus({
				covered: 0,
				remaining: commitment.amount,
				nextDueAt: resolveCoverageNextDueAt(commitment, now),
				now,
			}),
		});
	}

	return results;
}

export function computeCommitmentCoverage(params: {
	commitment: CommitmentSlice;
	commitments?: CommitmentSlice[];
	cycle: CycleSlice;
	incomeEvents: IncomeEventSlice[];
	now: number;
}): CommitmentCoverageResult {
	const commitments = params.commitments ?? [params.commitment];
	const cascade = computeAllCommitmentCoverage({
		commitments,
		cycle: params.cycle,
		incomeEvents: params.incomeEvents,
		now: params.now,
	});

	return (
		cascade.get(params.commitment.id) ?? {
			covered: 0,
			remaining: params.commitment.amount,
			fundingEvents: [],
			status: resolveCommitmentCoverageStatus({
				covered: 0,
				remaining: params.commitment.amount,
				nextDueAt: resolveCoverageNextDueAt(params.commitment, params.now),
				now: params.now,
			}),
		}
	);
}

export function computeCoverageProgressPercent(covered: number, amount: number): number {
	if (amount <= 0) return 0;
	return Math.min(100, Math.round((covered / amount) * 100));
}

export function computeUncoveredCommitmentRemainingCents(
	commitments: Array<{
		remaining: number;
		status: CommitmentCoverageStatus;
	}>,
): number {
	return commitments
		.filter((commitment) => commitment.status !== "covered")
		.reduce((acc, commitment) => acc + commitment.remaining, 0);
}

export { daysUntilNextDue };
