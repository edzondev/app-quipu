import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	type CommitmentCoverageResult,
	type CommitmentSlice,
	computeAllCommitmentCoverage,
	type IncomeEventSlice,
	type ReservationCoverageSlice,
} from "./commitmentCoverage";
import { activeReservedCents } from "./commitmentReservation";

export type CycleCoverageDocs = {
	cycle: Pick<Doc<"financialCycles">, "_id" | "startDate" | "endDate" | "coverageBoost">;
	envelopes?: ReadonlyArray<Pick<Doc<"envelopes">, "type" | "carriedOverCents">>;
	commitments: ReadonlyArray<
		Pick<
			Doc<"fixedCommitments">,
			"_id" | "amount" | "envelope" | "dueDay" | "nextDueAt" | "postponedForCycleId"
		> & { _creationTime?: number }
	>;
	incomeEvents: ReadonlyArray<
		Pick<Doc<"incomeEvents">, "_id" | "occurredAt" | "distributionApplied">
	>;
	reservationRows: ReadonlyArray<
		Pick<
			Doc<"commitmentReservations">,
			| "commitmentId"
			| "reservedCents"
			| "consumedCents"
			| "releasedCents"
			| "status"
			| "incomeEventId"
		>
	>;
};

/**
 * Pure builder: cascade coverage for a cycle including reservation ledger.
 * All callers must use this (or loadCycleCoverageById) so reserved money is never ignored.
 */
export function buildCoverageByIdFromCycleDocs(
	docs: CycleCoverageDocs,
	now: number,
): Map<string, CommitmentCoverageResult> {
	const { cycle, commitments, incomeEvents, reservationRows, envelopes } = docs;

	const commitmentSlices: CommitmentSlice[] = commitments.map((commitment) => ({
		id: commitment._id,
		amount: commitment.amount,
		envelope: commitment.envelope,
		dueDay: commitment.dueDay,
		nextDueAt: commitment.nextDueAt,
		createdAt: commitment._creationTime,
	}));

	const incomeEventSlices: IncomeEventSlice[] = incomeEvents.map((event) => ({
		id: event._id,
		occurredAt: event.occurredAt,
		distributionApplied: event.distributionApplied,
	}));
	const needsCarry =
		envelopes?.find((envelope) => envelope.type === "needs")?.carriedOverCents ?? 0;
	const wantsCarry =
		envelopes?.find((envelope) => envelope.type === "wants")?.carriedOverCents ?? 0;
	if (needsCarry > 0) {
		incomeEventSlices.push({
			id: "__carry_needs__",
			occurredAt: cycle.startDate,
			distributionApplied: { needs: needsCarry, wants: 0, savings: 0 },
		});
	}
	if (wantsCarry > 0) {
		incomeEventSlices.push({
			id: "__carry_wants__",
			occurredAt: cycle.startDate,
			distributionApplied: { needs: 0, wants: wantsCarry, savings: 0 },
		});
	}

	const reservations: ReservationCoverageSlice[] = reservationRows.map((row) => ({
		commitmentId: row.commitmentId,
		activeCents: activeReservedCents(row),
		incomeEventId: row.incomeEventId,
	}));

	const excludedCommitmentIds = new Set<Id<"fixedCommitments">>();
	for (const commitment of commitments) {
		if (commitment.postponedForCycleId === cycle._id) {
			excludedCommitmentIds.add(commitment._id);
		}
	}

	return computeAllCommitmentCoverage({
		commitments: commitmentSlices,
		cycle: {
			startDate: cycle.startDate,
			endDate: cycle.endDate,
		},
		incomeEvents: incomeEventSlices,
		now,
		coverageBoost: cycle.coverageBoost ?? undefined,
		reservations,
		excludedCommitmentIds,
	});
}

export async function loadCycleCoverageById(
	ctx: QueryCtx | MutationCtx,
	profileId: Id<"profiles">,
	cycleId: Id<"financialCycles">,
	now: number,
): Promise<{
	cycle: Doc<"financialCycles">;
	commitments: Doc<"fixedCommitments">[];
	incomeEvents: Doc<"incomeEvents">[];
	reservationRows: Doc<"commitmentReservations">[];
	coverageById: Map<string, CommitmentCoverageResult>;
} | null> {
	const cycle = await ctx.db.get(cycleId);
	if (!cycle) return null;

	const [commitments, incomeEvents, reservationRows, envelopes] = await Promise.all([
		ctx.db
			.query("fixedCommitments")
			.withIndex("by_profileId", (q) => q.eq("profileId", profileId))
			.collect(),
		ctx.db
			.query("incomeEvents")
			.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
			.collect(),
		ctx.db
			.query("commitmentReservations")
			.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
			.collect(),
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId))
			.collect(),
	]);

	const coverageById = buildCoverageByIdFromCycleDocs(
		{
			cycle,
			commitments,
			incomeEvents,
			reservationRows,
			envelopes,
		},
		now,
	);

	return {
		cycle,
		commitments,
		incomeEvents,
		reservationRows,
		coverageById,
	};
}
