import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { SurplusFromEnvelope } from "./surplusValidators";

/** Misma escritura que `moveSurplusToSavings`: saldo del sub-sobre + fila de aporte. */
export async function creditSubEnvelopeFromSurplus(
	ctx: MutationCtx,
	input: {
		profileId: Id<"profiles">;
		cycleId: Id<"financialCycles">;
		fromEnvelope: SurplusFromEnvelope;
		amount: number;
		subEnvelopeId: Id<"subEnvelopes">;
		createdAt: number;
	},
): Promise<void> {
	const subEnvelope = await ctx.db.get("subEnvelopes", input.subEnvelopeId);
	if (!subEnvelope) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Meta de ahorro no encontrada.",
		});
	}
	await ctx.db.patch(input.subEnvelopeId, {
		currentAmount: subEnvelope.currentAmount + input.amount,
	});
	await ctx.db.insert("surplusContributions", {
		profileId: input.profileId,
		cycleId: input.cycleId,
		fromEnvelope: input.fromEnvelope,
		amount: input.amount,
		subEnvelopeId: input.subEnvelopeId,
		createdAt: input.createdAt,
		contributionKind: "additional",
	});
}
