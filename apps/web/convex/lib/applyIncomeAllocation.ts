import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { type AllocationPlan, buildAllocationApplyResult } from "./incomeAllocation";

export async function persistIncomeAllocation(
	ctx: MutationCtx,
	input: {
		profileId: Id<"profiles">;
		cycleId: Id<"financialCycles">;
		incomeEventId: Id<"incomeEvents">;
		amountCents: number;
		plan: AllocationPlan;
		now: number;
		emergencyFundId?: Id<"subEnvelopes">;
	},
): Promise<{
	distributionApplied: { needs: number; wants: number; savings: number };
	heldCents: number;
	unallocatedCents: number;
	reservationIds: Id<"commitmentReservations">[];
}> {
	const applied = buildAllocationApplyResult({
		amountCents: input.amountCents,
		plan: input.plan,
	});

	const reservationRows = input.plan.reservations.filter((row) => row.amountCents > 0);
	const reservationIds = await Promise.all(
		reservationRows.map(async (reservation) => {
			const commitmentId = reservation.commitmentId as Id<"fixedCommitments">;
			const commitment = await ctx.db.get(commitmentId);
			if (!commitment || commitment.profileId !== input.profileId) {
				throw new Error("Compromiso no válido para reservar.");
			}
			const reservationId = await ctx.db.insert("commitmentReservations", {
				profileId: input.profileId,
				cycleId: input.cycleId,
				commitmentId,
				incomeEventId: input.incomeEventId,
				reservedCents: reservation.amountCents,
				status: "active",
				consumedCents: 0,
				releasedCents: 0,
				createdAt: input.now,
			});
			await ctx.db.insert("incomeAllocationLines", {
				profileId: input.profileId,
				cycleId: input.cycleId,
				incomeEventId: input.incomeEventId,
				destination: "commitment_reservation",
				amountCents: reservation.amountCents,
				commitmentId,
				reservationId,
				createdAt: input.now,
			});
			return reservationId;
		}),
	);

	const envelopeDest = {
		needs: "envelope_needs",
		wants: "envelope_wants",
		savings: "envelope_savings",
	} as const;

	await Promise.all(
		(["needs", "wants", "savings"] as const)
			.filter((type) => input.plan.envelopes[type] > 0)
			.map((type) =>
				ctx.db.insert("incomeAllocationLines", {
					profileId: input.profileId,
					cycleId: input.cycleId,
					incomeEventId: input.incomeEventId,
					destination: envelopeDest[type],
					amountCents: input.plan.envelopes[type],
					createdAt: input.now,
				}),
			),
	);

	const contributionRows = input.plan.savingsContributions.filter((row) => row.amountCents > 0);
	const resolvedContributions = contributionRows.map((contribution) => {
		const subEnvelopeId = (contribution.subEnvelopeId ?? input.emergencyFundId) as
			| Id<"subEnvelopes">
			| undefined;
		if (!subEnvelopeId) {
			throw new Error("No hay Fondo para registrar el aporte de ahorro.");
		}
		return { contribution, subEnvelopeId };
	});

	const uniqueSubIds = [...new Set(resolvedContributions.map((r) => r.subEnvelopeId))];
	const subDocs = await Promise.all(uniqueSubIds.map((id) => ctx.db.get(id)));
	const subById = new Map(uniqueSubIds.map((id, index) => [id, subDocs[index]] as const));

	const totalsBySub = new Map<Id<"subEnvelopes">, number>();
	for (const { contribution, subEnvelopeId } of resolvedContributions) {
		const subEnvelope = subById.get(subEnvelopeId);
		if (!subEnvelope || subEnvelope.profileId !== input.profileId) {
			throw new Error("Meta de ahorro no válida.");
		}
		totalsBySub.set(
			subEnvelopeId,
			(totalsBySub.get(subEnvelopeId) ?? 0) + contribution.amountCents,
		);
	}

	await Promise.all(
		[...totalsBySub.entries()].map(([subEnvelopeId, delta]) => {
			const subEnvelope = subById.get(subEnvelopeId);
			if (!subEnvelope) return Promise.resolve();
			return ctx.db.patch(subEnvelopeId, {
				currentAmount: subEnvelope.currentAmount + delta,
			});
		}),
	);

	await Promise.all(
		resolvedContributions.map(({ contribution, subEnvelopeId }) =>
			ctx.db.insert("incomeAllocationLines", {
				profileId: input.profileId,
				cycleId: input.cycleId,
				incomeEventId: input.incomeEventId,
				destination: "savings_contribution",
				amountCents: contribution.amountCents,
				subEnvelopeId,
				contributionKind: contribution.kind,
				createdAt: input.now,
			}),
		),
	);

	if (input.plan.leaveUnallocatedCents > 0) {
		await ctx.db.insert("incomeAllocationLines", {
			profileId: input.profileId,
			cycleId: input.cycleId,
			incomeEventId: input.incomeEventId,
			destination: "unallocated",
			amountCents: input.plan.leaveUnallocatedCents,
			createdAt: input.now,
		});
	}

	return {
		distributionApplied: applied.distributionApplied,
		heldCents: applied.heldFromReservationsCents,
		unallocatedCents: applied.totals.unallocatedCents,
		reservationIds,
	};
}
