import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireActiveAccount } from "./lib/entitlements";
import { isEnvelopeFrozen } from "./lib/envelopeGuards";
import { getActiveSpaceCycle, requireSpaceMember, requireSpaceWritable } from "./lib/spaceAuth";

const ENVELOPE_LABELS: Record<"needs" | "wants" | "savings", string> = {
	needs: "Necesidades",
	wants: "Gustos",
	savings: "Ahorro",
};

export const register = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		amount: v.number(),
		description: v.string(),
		envelopeType: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
		fundingSource: v.union(v.literal("space_budget"), v.literal("personal_pocket")),
		paidByProfileId: v.optional(v.id("profiles")),
	},
	returns: v.id("spaceExpenses"),
	handler: async (ctx, args) => {
		const { profile } = await requireSpaceMember(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);

		const payerId = args.paidByProfileId ?? profile._id;
		if (payerId !== profile._id) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Solo puedes registrar gastos en tu nombre.",
			});
		}

		if (!Number.isInteger(args.amount) || args.amount <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El monto debe ser un entero positivo.",
			});
		}

		const description = args.description.trim();
		if (!description) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "La descripción es obligatoria.",
			});
		}

		const spaceCycle = await getActiveSpaceCycle(ctx, args.spaceId);
		if (!spaceCycle) {
			throw new ConvexError({
				code: "NO_ACTIVE_CYCLE",
				message: "No hay ciclo activo en el espacio.",
			});
		}

		const now = Date.now();
		const spaceEnvelope = await ctx.db
			.query("spaceEnvelopes")
			.withIndex("by_cycle_type", (q) =>
				q.eq("cycleId", spaceCycle._id).eq("type", args.envelopeType),
			)
			.unique();
		if (!spaceEnvelope) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Sobre del espacio no encontrado.",
			});
		}

		if (args.fundingSource === "space_budget") {
			if (spaceEnvelope.remainingAmount < args.amount) {
				const label = ENVELOPE_LABELS[args.envelopeType];
				const available = (spaceEnvelope.remainingAmount / 100).toFixed(2);
				throw new ConvexError({
					code: "INSUFFICIENT_ENVELOPE_BALANCE",
					message: `Saldo insuficiente en ${label}. Disponible: S/ ${available}.`,
				});
			}
			await ctx.db.patch(spaceEnvelope._id, {
				remainingAmount: spaceEnvelope.remainingAmount - args.amount,
			});
		} else {
			const payer = await requireActiveAccount(ctx);
			const activePersonalCycle = await ctx.db
				.query("financialCycles")
				.withIndex("by_profile_status", (q) => q.eq("profileId", payer._id).eq("status", "active"))
				.unique();
			if (!activePersonalCycle) {
				throw new ConvexError({
					code: "NO_ACTIVE_CYCLE",
					message: "Necesitas un ciclo personal activo.",
				});
			}

			const personalType = args.envelopeType === "savings" ? "savings" : args.envelopeType;
			const personalEnvelope = await ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) =>
					q.eq("cycleId", activePersonalCycle._id).eq("type", personalType),
				)
				.unique();
			if (!personalEnvelope) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "Sobre personal no encontrado.",
				});
			}
			if (isEnvelopeFrozen(personalEnvelope.frozenUntil, now)) {
				throw new ConvexError({
					code: "ENVELOPE_FROZEN",
					message: "Tu sobre personal está congelado.",
				});
			}
			if (personalEnvelope.remainingAmount < args.amount) {
				throw new ConvexError({
					code: "INSUFFICIENT_ENVELOPE_BALANCE",
					message: "Saldo insuficiente en tu sobre personal.",
				});
			}

			await ctx.db.patch(personalEnvelope._id, {
				remainingAmount: personalEnvelope.remainingAmount - args.amount,
			});
		}

		const expenseId = await ctx.db.insert("spaceExpenses", {
			spaceId: args.spaceId,
			cycleId: spaceCycle._id,
			paidByProfileId: payerId,
			envelopeType: args.envelopeType,
			fundingSource: args.fundingSource,
			amount: args.amount,
			description,
			timestamp: now,
		});

		if (args.fundingSource === "personal_pocket") {
			await ctx.db.insert("spaceContributions", {
				spaceId: args.spaceId,
				cycleId: spaceCycle._id,
				fromProfileId: payerId,
				kind: "expense_paid_personally",
				amountCents: args.amount,
				envelopeType: args.envelopeType,
				linkedSpaceExpenseId: expenseId,
				createdAt: now,
			});
			await ctx.db.patch(spaceCycle._id, {
				totalContributionsReceived: spaceCycle.totalContributionsReceived + args.amount,
			});
		}

		return expenseId;
	},
});
