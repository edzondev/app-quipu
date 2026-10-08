import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireActiveAccount } from "./lib/entitlements";
import { isEnvelopeFrozen } from "./lib/envelopeGuards";
import { getActiveSpaceCycle, requireSpaceWritable } from "./lib/spaceAuth";

export const contribute = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		amountCents: v.number(),
		personalEnvelopeType: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
		spaceEnvelopeType: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
	},
	returns: v.id("spaceContributions"),
	handler: async (ctx, args) => {
		const profile = await requireActiveAccount(ctx);
		await requireSpaceWritable(ctx, args.spaceId);

		if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El monto debe ser un entero positivo.",
			});
		}

		const activePersonalCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activePersonalCycle) {
			throw new ConvexError({
				code: "NO_ACTIVE_CYCLE",
				message: "Necesitas un ciclo personal activo para aportar.",
			});
		}

		const personalEnvelope = await ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) =>
				q.eq("cycleId", activePersonalCycle._id).eq("type", args.personalEnvelopeType),
			)
			.unique();
		if (!personalEnvelope) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Sobre personal no encontrado.",
			});
		}

		const now = Date.now();
		if (isEnvelopeFrozen(personalEnvelope.frozenUntil, now)) {
			throw new ConvexError({
				code: "ENVELOPE_FROZEN",
				message: "El sobre personal está congelado.",
			});
		}
		if (personalEnvelope.remainingAmount < args.amountCents) {
			throw new ConvexError({
				code: "INSUFFICIENT_ENVELOPE_BALANCE",
				message: "Saldo insuficiente en tu sobre personal.",
			});
		}

		const spaceCycle = await getActiveSpaceCycle(ctx, args.spaceId);
		if (!spaceCycle) {
			throw new ConvexError({
				code: "NO_ACTIVE_CYCLE",
				message: "No hay ciclo activo en el espacio.",
			});
		}

		const spaceEnvelope = await ctx.db
			.query("spaceEnvelopes")
			.withIndex("by_cycle_type", (q) =>
				q.eq("cycleId", spaceCycle._id).eq("type", args.spaceEnvelopeType),
			)
			.unique();
		if (!spaceEnvelope) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Sobre del espacio no encontrado.",
			});
		}

		await ctx.db.patch(personalEnvelope._id, {
			remainingAmount: personalEnvelope.remainingAmount - args.amountCents,
		});

		const transferId = await ctx.db.insert("internalTransfers", {
			profileId: profile._id,
			cycleId: activePersonalCycle._id,
			kind: "personal_to_space_contribution",
			amountCents: args.amountCents,
			from: args.personalEnvelopeType,
			to: `space:${args.spaceId}:${args.spaceEnvelopeType}`,
			spaceId: args.spaceId,
			createdAt: now,
		});

		const contributionId = await ctx.db.insert("spaceContributions", {
			spaceId: args.spaceId,
			cycleId: spaceCycle._id,
			fromProfileId: profile._id,
			fromPersonalEnvelopeId: personalEnvelope._id,
			kind: "explicit_transfer",
			amountCents: args.amountCents,
			envelopeType: args.spaceEnvelopeType,
			linkedPersonalTransferId: transferId,
			createdAt: now,
		});

		await ctx.db.patch(transferId, { spaceContributionId: contributionId });

		await ctx.db.patch(spaceEnvelope._id, {
			allocatedAmount: spaceEnvelope.allocatedAmount + args.amountCents,
			remainingAmount: spaceEnvelope.remainingAmount + args.amountCents,
		});

		await ctx.db.patch(spaceCycle._id, {
			totalContributionsReceived: spaceCycle.totalContributionsReceived + args.amountCents,
		});

		return contributionId;
	},
});
