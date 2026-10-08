import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { sumActiveReservedCents } from "./lib/commitmentReservation";
import { buildCycleCorrectionTransfers, type CycleCorrectionPlan } from "./lib/cycleCorrection";
import { allowsOutboundTransfer } from "./lib/envelopeGuards";
import { evaluateCommitmentCoverageForCycle } from "./lib/evaluateCommitmentCoverage";
import { planInferredSavingsAnnulment } from "./lib/inferredSavingsAnnulment";
import { assertNonNegativeCents } from "./lib/moneyInvariant";

export const correctActiveCycleAllocation = mutation({
	args: {
		reserveToCommitments: v.array(
			v.object({
				commitmentId: v.id("fixedCommitments"),
				amountCents: v.number(),
			}),
		),
		setEnvelopeRemaining: v.object({
			needs: v.number(),
			wants: v.number(),
			savings: v.number(),
		}),
		contributeToSavings: v.array(
			v.object({
				amountCents: v.number(),
				kind: v.union(v.literal("objective"), v.literal("additional")),
				subEnvelopeId: v.optional(v.id("subEnvelopes")),
			}),
		),
		setUnallocatedCents: v.number(),
		/**
		 * Bank cash represented by this correction (sobres + reservado +
		 * por repartir + aportes). When it differs from Quipu liquid, creates
		 * a liquidity_reconciliation transfer (not income/expense/savings).
		 */
		declaredLiquidCents: v.optional(v.number()),
		/**
		 * Reduce Fondo by this amount when prior “ahorro adicional” was inferred
		 * and never real. Does not move money into another envelope.
		 */
		annulInferredSavingsCents: v.optional(v.number()),
		note: v.optional(v.string()),
	},
	returns: v.object({
		success: v.literal(true),
		transferCount: v.number(),
		contributionCents: v.number(),
		reconciliationDeltaCents: v.number(),
		annulInferredSavingsCents: v.number(),
		unallocatedCents: v.number(),
		reservedCents: v.number(),
		spendableCents: v.number(),
	}),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
			});
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Perfil no encontrado.",
			});
		}

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activeCycle) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Necesitas un ciclo activo para corregir la distribución.",
			});
		}

		const plan: CycleCorrectionPlan = {
			reserveToCommitments: args.reserveToCommitments.map((row) => ({
				commitmentId: row.commitmentId,
				amountCents: row.amountCents,
			})),
			setEnvelopeRemaining: args.setEnvelopeRemaining,
			contributeToSavings: args.contributeToSavings.map((row) => ({
				amountCents: row.amountCents,
				kind: row.kind,
				subEnvelopeId: row.subEnvelopeId,
			})),
			setUnallocatedCents: args.setUnallocatedCents,
			declaredLiquidCents: args.declaredLiquidCents,
			note: args.note,
		};

		const envelopes = await ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
			.collect();
		const needs = envelopes.find((e) => e.type === "needs");
		const wants = envelopes.find((e) => e.type === "wants");
		const savings = envelopes.find((e) => e.type === "savings");
		if (!needs || !wants || !savings) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Faltan sobres del ciclo activo.",
			});
		}

		const existingReservations = await ctx.db
			.query("commitmentReservations")
			.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
			.collect();

		const before = {
			needsRemaining: needs.remainingAmount,
			wantsRemaining: wants.remainingAmount,
			savingsRemaining: savings.remainingAmount,
			unallocatedCents: activeCycle.unallocatedCents ?? 0,
			activeReservedCents: sumActiveReservedCents(existingReservations),
		};

		let draft: ReturnType<typeof buildCycleCorrectionTransfers>;
		try {
			draft = buildCycleCorrectionTransfers({ before, plan });
		} catch (error) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: error instanceof Error ? error.message : "Corrección inválida.",
			});
		}

		if (!draft.conservedLiquidMinusContributions) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message:
					"La corrección no conserva el dinero líquido. Revisa los montos (sobres + reservado + por repartir + aportes).",
			});
		}

		const now = Date.now();

		// Release previous active reservations (return conceptually into correction pool).
		const activeToRelease = existingReservations.filter(
			(reservation) => reservation.status !== "consumed" && reservation.status !== "released",
		);
		await Promise.all(
			activeToRelease.map(async (reservation) => {
				await ctx.db.patch(reservation._id, {
					status: "released",
					releasedCents: reservation.reservedCents - reservation.consumedCents,
					updatedAt: now,
				});
				await ctx.db.insert("internalTransfers", {
					profileId: profile._id,
					cycleId: activeCycle._id,
					kind: "reservation_release",
					amountCents: reservation.reservedCents - reservation.consumedCents,
					from: `reservation:${reservation._id}`,
					to: "correction:pool",
					note: args.note,
					createdAt: now,
				});
			}),
		);

		// Apply envelope remaining targets; adjust allocated so progress stays coherent.
		const envelopeByType = new Map(envelopes.map((envelope) => [envelope.type, envelope] as const));
		await Promise.all(
			(["needs", "wants", "savings"] as const).map(async (type) => {
				const envelope = envelopeByType.get(type);
				if (!envelope) return;
				const targetRemaining = plan.setEnvelopeRemaining[type];
				assertNonNegativeCents(targetRemaining, type);
				if (
					targetRemaining < envelope.remainingAmount &&
					!allowsOutboundTransfer(envelope.frozenUntil, now)
				) {
					throw new ConvexError({
						code: "ENVELOPE_FROZEN",
						message: `El sobre ${type} está congelado. No puedes reducir su saldo todavía.`,
					});
				}
				const spent = Math.max(0, envelope.allocatedAmount - envelope.remainingAmount);
				await ctx.db.patch(envelope._id, {
					remainingAmount: targetRemaining,
					allocatedAmount: spent + targetRemaining,
				});
			}),
		);

		// Create new reservations from plan.
		const reserveRows = args.reserveToCommitments.filter((row) => row.amountCents > 0);
		const reservedCents = reserveRows.reduce((sum, row) => sum + row.amountCents, 0);
		await Promise.all(
			reserveRows.map(async (row) => {
				const commitment = await ctx.db.get(row.commitmentId);
				if (!commitment || commitment.profileId !== profile._id) {
					throw new ConvexError({
						code: "NOT_FOUND",
						message: "Compromiso no encontrado para reservar.",
					});
				}
				const reservationId = await ctx.db.insert("commitmentReservations", {
					profileId: profile._id,
					cycleId: activeCycle._id,
					commitmentId: row.commitmentId,
					reservedCents: row.amountCents,
					status: "active",
					consumedCents: 0,
					releasedCents: 0,
					createdAt: now,
				});
				await ctx.db.insert("internalTransfers", {
					profileId: profile._id,
					cycleId: activeCycle._id,
					kind: "unallocated_to_reservation",
					amountCents: row.amountCents,
					from: "correction:pool",
					to: `reservation:${reservationId}`,
					note: args.note,
					createdAt: now,
				});
			}),
		);

		// Confirmed contributions to Fondo/metas.
		const contributionRows = args.contributeToSavings.filter((row) => row.amountCents > 0);
		const contributionCents = contributionRows.reduce((sum, row) => sum + row.amountCents, 0);
		const subEnvelopes = await ctx.db
			.query("subEnvelopes")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.collect();
		const defaultFund = subEnvelopes.find((row) => row.isSystemDefault) ?? subEnvelopes[0];

		const resolvedContributions = contributionRows.map((contribution) => {
			const targetId = contribution.subEnvelopeId ?? defaultFund?._id;
			if (!targetId) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "No hay Fondo para el aporte.",
				});
			}
			return { contribution, targetId };
		});
		const uniqueTargets = [...new Set(resolvedContributions.map((r) => r.targetId))];
		const targetDocs = await Promise.all(uniqueTargets.map((id) => ctx.db.get(id)));
		const targetById = new Map(uniqueTargets.map((id, index) => [id, targetDocs[index]] as const));
		for (const { targetId } of resolvedContributions) {
			const sub = targetById.get(targetId);
			if (!sub || sub.profileId !== profile._id) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "Meta de ahorro no encontrada.",
				});
			}
		}
		const totalsByTarget = new Map<Id<"subEnvelopes">, number>();
		for (const { contribution, targetId } of resolvedContributions) {
			totalsByTarget.set(targetId, (totalsByTarget.get(targetId) ?? 0) + contribution.amountCents);
		}
		await Promise.all(
			[...totalsByTarget.entries()].map(([targetId, delta]) => {
				const sub = targetById.get(targetId);
				if (!sub) return Promise.resolve();
				return ctx.db.patch(targetId, {
					currentAmount: sub.currentAmount + delta,
				});
			}),
		);
		await Promise.all(
			resolvedContributions.flatMap(({ contribution, targetId }) => [
				ctx.db.insert("surplusContributions", {
					profileId: profile._id,
					cycleId: activeCycle._id,
					fromEnvelope: "needs",
					amount: contribution.amountCents,
					subEnvelopeId: targetId,
					createdAt: now,
					contributionKind: contribution.kind,
				}),
				ctx.db.insert("internalTransfers", {
					profileId: profile._id,
					cycleId: activeCycle._id,
					kind: "unallocated_to_savings",
					amountCents: contribution.amountCents,
					from: "correction:pool",
					to: `subEnvelope:${targetId}`,
					note: args.note,
					createdAt: now,
				}),
			]),
		);

		await Promise.all(
			draft.transfers.map((transfer) =>
				ctx.db.insert("internalTransfers", {
					profileId: profile._id,
					cycleId: activeCycle._id,
					kind: transfer.kind,
					amountCents: transfer.amountCents,
					from: transfer.from,
					to: transfer.to,
					note: args.note,
					createdAt: now,
				}),
			),
		);

		const annulInferredSavingsCents = Math.max(0, args.annulInferredSavingsCents ?? 0);
		if (annulInferredSavingsCents > 0) {
			assertNonNegativeCents(annulInferredSavingsCents, "annulInferredSavingsCents");
			const fundTargets = await ctx.db
				.query("subEnvelopes")
				.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
				.collect();
			const fund = fundTargets.find((row) => row.isSystemDefault) ?? fundTargets[0];
			if (!fund) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "No hay Fondo para anular ahorro inferido.",
				});
			}
			const cycleSurplus = await ctx.db
				.query("surplusContributions")
				.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
				.collect();
			const fundSurplus = cycleSurplus.filter((row) => row.subEnvelopeId === fund._id);
			let annulPlan: ReturnType<typeof planInferredSavingsAnnulment>;
			try {
				annulPlan = planInferredSavingsAnnulment({
					annulCents: annulInferredSavingsCents,
					fundCurrentAmount: fund.currentAmount,
					surplusRows: fundSurplus.map((row) => ({
						id: row._id,
						amount: row.amount,
						contributionKind: row.contributionKind,
					})),
				});
			} catch (error) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: error instanceof Error ? error.message : "No se pudo anular el ahorro inferido.",
				});
			}
			await ctx.db.patch(fund._id, {
				currentAmount: annulPlan.fundAfter,
			});
			await Promise.all(
				annulPlan.surplusPatches.map((patch) =>
					ctx.db.patch(patch.id as Id<"surplusContributions">, {
						amount: patch.amount,
					}),
				),
			);
			await Promise.all(
				annulPlan.surplusDeletes.map((id) => ctx.db.delete(id as Id<"surplusContributions">)),
			);
			await ctx.db.insert("internalTransfers", {
				profileId: profile._id,
				cycleId: activeCycle._id,
				kind: "inferred_savings_annulment",
				amountCents: annulInferredSavingsCents,
				from: `subEnvelope:${fund._id}`,
				to: "correction:annulled",
				note: args.note,
				createdAt: now,
			});
		}

		await ctx.db.patch(activeCycle._id, {
			unallocatedCents: plan.setUnallocatedCents,
			needsReview: false,
		});

		await evaluateCommitmentCoverageForCycle(ctx, profile._id, activeCycle._id, now);

		const spendableCents = plan.setEnvelopeRemaining.needs + plan.setEnvelopeRemaining.wants;

		return {
			success: true as const,
			transferCount: draft.transfers.length + (annulInferredSavingsCents > 0 ? 1 : 0),
			contributionCents,
			reconciliationDeltaCents: draft.reconciliationDeltaCents,
			annulInferredSavingsCents,
			unallocatedCents: plan.setUnallocatedCents,
			reservedCents,
			spendableCents,
		};
	},
});

export const getRegisteredCycleIncome = query({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return 0;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return 0;

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activeCycle) return 0;

		const incomes = await ctx.db
			.query("incomeEvents")
			.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
			.collect();
		return incomes.reduce((sum, event) => sum + event.amount, 0);
	},
});

/** Lets an affected user flag their active cycle for redistribution review. */
export const markActiveCycleNeedsReview = mutation({
	args: {},
	returns: v.object({
		success: v.literal(true),
		cycleId: v.id("financialCycles"),
	}),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
			});
		}
		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Perfil no encontrado.",
			});
		}
		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activeCycle) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Necesitas un ciclo activo.",
			});
		}
		await ctx.db.patch(activeCycle._id, { needsReview: true });
		return { success: true as const, cycleId: activeCycle._id };
	},
});
