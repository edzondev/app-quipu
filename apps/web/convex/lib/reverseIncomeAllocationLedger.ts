import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { planIncomeDeleteLedgerReverse } from "./incomeDeleteReverse";

/**
 * Reverses allocation ledger side-effects for one income event:
 * releases reservations, undoes savings contributions, deletes lines.
 * Does NOT touch envelopes or the income event document.
 */
export async function reverseIncomeAllocationLedger(
	ctx: MutationCtx,
	input: {
		profileId: Id<"profiles">;
		cycleId: Id<"financialCycles">;
		incomeEventId: Id<"incomeEvents">;
		now: number;
		note?: string;
	},
): Promise<{ unallocatedDeltaCents: number }> {
	const allocationLines = await ctx.db
		.query("incomeAllocationLines")
		.withIndex("by_income_event", (q) => q.eq("incomeEventId", input.incomeEventId))
		.collect();

	const reversePlan = planIncomeDeleteLedgerReverse(
		allocationLines.map((line) => ({
			destination: line.destination,
			amountCents: line.amountCents,
			reservationId: line.reservationId,
			subEnvelopeId: line.subEnvelopeId,
			contributionKind: line.contributionKind,
		})),
	);

	await Promise.all(
		reversePlan.reservationIdsToRelease.map(async (reservationId) => {
			const reservation = await ctx.db.get(reservationId);
			if (!reservation) return;
			const active =
				reservation.reservedCents - reservation.consumedCents - reservation.releasedCents;
			await ctx.db.patch(reservationId, {
				status: "released",
				releasedCents: reservation.releasedCents + Math.max(0, active),
				updatedAt: input.now,
			});
			await ctx.db.insert("internalTransfers", {
				profileId: input.profileId,
				cycleId: input.cycleId,
				kind: "reservation_release",
				amountCents: Math.max(0, active),
				from: `reservation:${reservationId}`,
				to: "income_rewrite",
				note: input.note ?? "Reverso de distribución de ingreso",
				createdAt: input.now,
			});
		}),
	);

	await Promise.all(
		reversePlan.subEnvelopeReversals.map(async (reversal) => {
			const sub = await ctx.db.get(reversal.subEnvelopeId);
			if (!sub) return;
			await ctx.db.patch(reversal.subEnvelopeId, {
				currentAmount: Math.max(0, sub.currentAmount - reversal.amountCents),
			});
		}),
	);

	await Promise.all(allocationLines.map((line) => ctx.db.delete(line._id)));

	return { unallocatedDeltaCents: reversePlan.unallocatedDeltaCents };
}
