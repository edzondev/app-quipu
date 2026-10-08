import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { suggestRescueTransfer } from "./lib/budgetMath";
import { resolveCoachPresentation, WANTS_OVERFLOW_EVENT } from "./lib/coachState";
import { buildCrisisPlan } from "./lib/crisisPlan";
import { computeCoverFromSavingsSplit } from "./lib/crisisResolution";
import { requireActiveAccount, requirePremiumProfile } from "./lib/entitlements";
import { allowsOutboundTransfer } from "./lib/envelopeGuards";
import { evaluateCommitmentCoverageForCycle } from "./lib/evaluateCommitmentCoverage";
import { loadCycleCoverageById } from "./lib/loadCycleCoverageContext";
import { computeRescueEnvelopePatches, validateRescueTransferApply } from "./lib/rescueTransfer";

export { resolveCoachPresentation, WANTS_OVERFLOW_EVENT };

const FREEZE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
const CRISIS_SNOOZE_MS = 24 * 60 * 60 * 1000;

async function getOwnedPendingInteraction(
	ctx: MutationCtx,
	interactionId: Id<"coachInteractions">,
) {
	const profile = await requireActiveAccount(ctx);

	const interaction = await ctx.db.get(interactionId);
	if (interaction?.status !== "pending") {
		throw new ConvexError({
			code: "VALIDATION_ERROR",
			message: "La interacción no existe o ya fue resuelta.",
		});
	}

	if (interaction.profileId !== profile._id) {
		throw new ConvexError({
			code: "FORBIDDEN",
			message: "No tienes permisos para modificar este registro.",
		});
	}

	return { interaction, profile };
}

async function getCycleEnvelopes(ctx: MutationCtx, cycleId: Id<"financialCycles">) {
	const [savings, wants] = await Promise.all([
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "savings"))
			.unique(),
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "wants"))
			.unique(),
	]);

	return { savings, wants };
}

async function getOwnedProfileAndCycle(ctx: MutationCtx) {
	const profile = await requireActiveAccount(ctx);

	const cycle = await ctx.db
		.query("financialCycles")
		.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
		.unique();
	if (!cycle) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "No hay un ciclo activo.",
		});
	}

	return { profile, cycle };
}

async function getCycleCoverageContext(
	ctx: QueryCtx | MutationCtx,
	profileId: Id<"profiles">,
	cycleId: Id<"financialCycles">,
	now: number,
) {
	const [coverageContext, envelopesRaw] = await Promise.all([
		loadCycleCoverageById(ctx, profileId, cycleId, now),
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId))
			.collect(),
	]);

	if (!coverageContext) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "No encontramos el ciclo activo.",
		});
	}

	const { cycle, commitments: commitmentsRaw, coverageById } = coverageContext;

	const commitments = commitmentsRaw.map((commitment) => {
		const coverage = coverageById.get(commitment._id);
		return {
			id: commitment._id,
			name: commitment.name,
			amount: commitment.amount,
			remaining: coverage?.remaining ?? commitment.amount,
			envelope: commitment.envelope,
			dueDay: commitment.dueDay,
			cascadeStatus: coverage?.status ?? ("not-started" as const),
		};
	});

	const envelopeByType = new Map(envelopesRaw.map((envelope) => [envelope.type, envelope]));

	return {
		cycle,
		commitments,
		savingsEnvelope: envelopeByType.get("savings"),
		needsEnvelope: envelopeByType.get("needs"),
		wantsEnvelope: envelopeByType.get("wants"),
	};
}

function buildRescueConfirmMessage(
	transfer: number,
	projectedDeficit: number,
	currencySymbol: string,
): string {
	const transferAmount = (transfer / 100).toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	const deficitAmount = (projectedDeficit / 100).toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return `Te sugiero transferir ${currencySymbol} ${transferAmount} de Ahorro a Gustos para cubrir ${currencySymbol} ${deficitAmount} de déficit. Confirma para aplicar.`;
}

export const getActiveNudge = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		return await ctx.db
			.query("coachInteractions")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "pending"))
			.order("desc")
			.first();
	},
});

export const resolveNudgeAction = mutation({
	args: {
		interactionId: v.id("coachInteractions"),
		optionId: v.union(v.literal("freeze_wants"), v.literal("suggest_rescue"), v.literal("ignore")),
	},
	handler: async (ctx, { interactionId, optionId }) => {
		const { interaction, profile } = await getOwnedPendingInteraction(ctx, interactionId);

		if (!interaction.options.some((o) => o.id === optionId)) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Opción inválida.",
			});
		}

		// I3 — rescate manual es gratis: mismo flujo para free y Plus.
		if (optionId === "suggest_rescue") {
			const { savings, wants } = await getCycleEnvelopes(ctx, interaction.cycleId);

			if (!savings || !wants) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "No se encontraron los sobres del ciclo actual.",
				});
			}

			const suggestion = suggestRescueTransfer(savings.remainingAmount, wants.remainingAmount);

			if (suggestion.transfer <= 0) {
				await ctx.db.patch(interactionId, {
					selectedOptionId: optionId,
					status: "resolved",
					initialNudge:
						"Por ahora no hay un rescate disponible: tu sobre de Gustos no está en déficit o no hay saldo en Ahorro para transferir.",
				});
				return { success: true, mode: "unavailable" as const };
			}

			await ctx.db.patch(interactionId, {
				selectedOptionId: optionId,
				rescueSuggestion: suggestion,
				initialNudge: buildRescueConfirmMessage(
					suggestion.transfer,
					suggestion.projectedDeficit,
					profile.currencySymbol,
				),
			});

			return {
				success: true,
				mode: "suggested" as const,
				suggestion,
			};
		}

		if (optionId === "freeze_wants") {
			const { wants } = await getCycleEnvelopes(ctx, interaction.cycleId);
			if (wants) {
				await ctx.db.patch(wants._id, {
					frozenUntil: Date.now() + FREEZE_DURATION_MS,
				});
			}
		}

		await ctx.db.patch(interactionId, {
			selectedOptionId: optionId,
			status: "resolved",
		});
		return { success: true, mode: "executed" as const };
	},
});

export const applyRescueTransfer = mutation({
	args: {
		interactionId: v.id("coachInteractions"),
	},
	handler: async (ctx, { interactionId }) => {
		// I3 — rescate manual es operación básica (gratis).
		const { interaction } = await getOwnedPendingInteraction(ctx, interactionId);

		if (interaction.selectedOptionId !== "suggest_rescue" || !interaction.rescueSuggestion) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Esta interacción no tiene una sugerencia de rescate pendiente.",
			});
		}

		const { savings, wants } = await getCycleEnvelopes(ctx, interaction.cycleId);
		if (!savings || !wants) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "No se encontraron los sobres del ciclo actual.",
			});
		}

		const validation = validateRescueTransferApply(interaction.rescueSuggestion, {
			savingsRemaining: savings.remainingAmount,
			wantsRemaining: wants.remainingAmount,
		});

		if (!validation.ok) {
			const messageByReason: Record<typeof validation.reason, string> = {
				NO_SUGGESTION: "No hay una sugerencia de rescate válida.",
				INVALID_TRANSFER: "El monto de rescate no es válido.",
				INSUFFICIENT_SAVINGS: "Ya no hay saldo suficiente en Ahorro para este rescate.",
				NO_RESCUE_NEEDED: "Tu sobre de Gustos ya no necesita rescate.",
			};
			throw new ConvexError({
				code:
					validation.reason === "INSUFFICIENT_SAVINGS" ? "INSUFFICIENT_FUNDS" : "VALIDATION_ERROR",
				message: messageByReason[validation.reason],
			});
		}

		const now = Date.now();
		if (!allowsOutboundTransfer(savings.frozenUntil, now)) {
			throw new ConvexError({
				code: "ENVELOPE_FROZEN",
				message: "El sobre de Ahorro está congelado. No puedes sacar dinero de él todavía.",
			});
		}

		const patches = computeRescueEnvelopePatches(
			{
				savingsRemaining: savings.remainingAmount,
				wantsRemaining: wants.remainingAmount,
			},
			validation.transfer,
		);

		await ctx.db.patch(savings._id, {
			remainingAmount: patches.savingsRemaining,
		});
		await ctx.db.patch(wants._id, {
			remainingAmount: patches.wantsRemaining,
		});
		await ctx.db.patch(interactionId, {
			status: "applied",
		});

		return {
			success: true,
			transfer: validation.transfer,
			savingsRemaining: patches.savingsRemaining,
			wantsRemaining: patches.wantsRemaining,
		};
	},
});

export const dismissRescueSuggestion = mutation({
	args: {
		interactionId: v.id("coachInteractions"),
	},
	handler: async (ctx, { interactionId }) => {
		const { interaction } = await getOwnedPendingInteraction(ctx, interactionId);

		if (interaction.selectedOptionId !== "suggest_rescue" || !interaction.rescueSuggestion) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Esta interacción no tiene una sugerencia de rescate pendiente.",
			});
		}

		await ctx.db.patch(interactionId, {
			status: "resolved",
		});

		return { success: true };
	},
});

export const applyCoverFromCycleSavings = mutation({
	args: {},
	handler: async (ctx) => {
		// I3 — cubrir desde ahorro del ciclo es Plus.
		await requirePremiumProfile(ctx);
		const now = Date.now();
		const { profile, cycle } = await getOwnedProfileAndCycle(ctx);
		const context = await getCycleCoverageContext(ctx, profile._id, cycle._id, now);

		if (!context.savingsEnvelope || !context.needsEnvelope || !context.wantsEnvelope) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "No se encontraron los sobres del ciclo actual.",
			});
		}

		const uncoveredByEnvelope = context.commitments.reduce(
			(acc, commitment) => {
				if (commitment.remaining <= 0) return acc;
				acc[commitment.envelope] += commitment.remaining;
				return acc;
			},
			{ needs: 0, wants: 0 },
		);

		const split = computeCoverFromSavingsSplit(
			uncoveredByEnvelope,
			context.savingsEnvelope.remainingAmount,
		);

		if (split.total <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Ya no hay saldo en Ahorro del ciclo para cubrir compromisos.",
			});
		}

		if (!allowsOutboundTransfer(context.savingsEnvelope.frozenUntil, now)) {
			throw new ConvexError({
				code: "ENVELOPE_FROZEN",
				message: "El sobre de Ahorro está congelado. No puedes sacar dinero de él todavía.",
			});
		}

		const nextBoost = {
			needs: (cycle.coverageBoost?.needs ?? 0) + split.needs,
			wants: (cycle.coverageBoost?.wants ?? 0) + split.wants,
		};

		await ctx.db.patch(context.savingsEnvelope._id, {
			remainingAmount: context.savingsEnvelope.remainingAmount - split.total,
		});
		await ctx.db.patch(context.needsEnvelope._id, {
			remainingAmount: context.needsEnvelope.remainingAmount + split.needs,
		});
		await ctx.db.patch(context.wantsEnvelope._id, {
			remainingAmount: context.wantsEnvelope.remainingAmount + split.wants,
		});
		await ctx.db.patch(cycle._id, {
			coverageBoost: nextBoost,
		});

		await evaluateCommitmentCoverageForCycle(ctx, profile._id, cycle._id, now);

		return {
			success: true,
			transferTotal: split.total,
			needsBoost: split.needs,
			wantsBoost: split.wants,
		};
	},
});

export const postponeCommitmentForCycle = mutation({
	args: {
		commitmentId: v.id("fixedCommitments"),
	},
	handler: async (ctx, { commitmentId }) => {
		const now = Date.now();
		const [{ profile, cycle }, commitment] = await Promise.all([
			getOwnedProfileAndCycle(ctx),
			ctx.db.get(commitmentId),
		]);

		if (!commitment || commitment.profileId !== profile._id) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "No encontramos ese compromiso.",
			});
		}

		const context = await getCycleCoverageContext(ctx, profile._id, cycle._id, now);
		const target = context.commitments.find((item) => item.id === commitmentId);

		if (!target || target.remaining <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Este compromiso ya está cubierto en el ciclo actual.",
			});
		}

		await ctx.db.patch(commitmentId, {
			postponedForCycleId: cycle._id,
			coveredAt: now,
			coveredBy: [],
		});

		await evaluateCommitmentCoverageForCycle(ctx, profile._id, cycle._id, now);

		return {
			success: true,
			commitmentId,
			freedAmount: target.remaining,
		};
	},
});

export const snoozeCrisisCoach = mutation({
	args: {},
	handler: async (ctx) => {
		const { profile } = await getOwnedProfileAndCycle(ctx);

		await ctx.db.patch(profile._id, {
			coachCrisisSnoozedUntil: Date.now() + CRISIS_SNOOZE_MS,
		});

		return { success: true };
	},
});

export const applyCrisisPlan = mutation({
	args: {},
	returns: v.object({
		success: v.boolean(),
		appliedSteps: v.number(),
		projectedCushionCents: v.number(),
		canFullyResolve: v.boolean(),
	}),
	handler: async (ctx) => {
		await requirePremiumProfile(ctx);

		const now = Date.now();
		const { profile, cycle } = await getOwnedProfileAndCycle(ctx);
		const context = await getCycleCoverageContext(ctx, profile._id, cycle._id, now);

		if (!context.savingsEnvelope || !context.needsEnvelope || !context.wantsEnvelope) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "No se encontraron los sobres del ciclo actual.",
			});
		}

		const plan = buildCrisisPlan({
			commitments: context.commitments.map((commitment) => ({
				id: commitment.id,
				name: commitment.name,
				amount: commitment.amount,
				remaining: commitment.remaining,
				envelope: commitment.envelope,
				dueDay: commitment.dueDay,
			})),
			savingsRemaining: context.savingsEnvelope.remainingAmount,
			wantsRemaining: context.wantsEnvelope.remainingAmount,
			needsRemaining: context.needsEnvelope.remainingAmount,
			cycleEndDate: cycle.endDate,
			currencySymbol: profile.currencySymbol,
		});

		if (!plan || plan.steps.length === 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "No hay un plan de crisis disponible para aplicar.",
			});
		}

		let savingsEnvelope = context.savingsEnvelope;
		let needsEnvelope = context.needsEnvelope;
		let wantsEnvelope = context.wantsEnvelope;
		let coverageBoost = {
			needs: cycle.coverageBoost?.needs ?? 0,
			wants: cycle.coverageBoost?.wants ?? 0,
		};
		const commitmentById = new Map(context.commitments.map((item) => [item.id, item]));

		for (const step of plan.steps) {
			if (step.kind === "postpone" && step.commitmentId) {
				const commitmentId = step.commitmentId as Id<"fixedCommitments">;
				const target = commitmentById.get(commitmentId);
				if (!target || target.remaining <= 0) {
					throw new ConvexError({
						code: "VALIDATION_ERROR",
						message: "El compromiso del plan ya no está pendiente.",
					});
				}

				await ctx.db.patch(commitmentId, {
					postponedForCycleId: cycle._id,
					coveredAt: now,
					coveredBy: [],
				});
				continue;
			}

			if (
				step.kind === "cover_from_savings" &&
				step.transferTotal != null &&
				step.needsBoost != null &&
				step.wantsBoost != null
			) {
				if (step.transferTotal <= 0) continue;
				if (!allowsOutboundTransfer(savingsEnvelope.frozenUntil, now)) {
					throw new ConvexError({
						code: "ENVELOPE_FROZEN",
						message: "El sobre de Ahorro está congelado. No puedes sacar dinero de él todavía.",
					});
				}
				if (savingsEnvelope.remainingAmount < step.transferTotal) {
					throw new ConvexError({
						code: "VALIDATION_ERROR",
						message: "Ya no hay saldo en Ahorro del ciclo para cubrir compromisos.",
					});
				}

				await ctx.db.patch(savingsEnvelope._id, {
					remainingAmount: savingsEnvelope.remainingAmount - step.transferTotal,
				});
				await ctx.db.patch(needsEnvelope._id, {
					remainingAmount: needsEnvelope.remainingAmount + step.needsBoost,
				});
				await ctx.db.patch(wantsEnvelope._id, {
					remainingAmount: wantsEnvelope.remainingAmount + step.wantsBoost,
				});
				coverageBoost = {
					needs: coverageBoost.needs + step.needsBoost,
					wants: coverageBoost.wants + step.wantsBoost,
				};
				await ctx.db.patch(cycle._id, { coverageBoost });

				savingsEnvelope = {
					...savingsEnvelope,
					remainingAmount: savingsEnvelope.remainingAmount - step.transferTotal,
				};
				needsEnvelope = {
					...needsEnvelope,
					remainingAmount: needsEnvelope.remainingAmount + step.needsBoost,
				};
				wantsEnvelope = {
					...wantsEnvelope,
					remainingAmount: wantsEnvelope.remainingAmount + step.wantsBoost,
				};
				continue;
			}

			if (step.kind === "rescue_transfer" && step.rescueTransfer != null) {
				if (step.rescueTransfer <= 0) continue;
				if (!allowsOutboundTransfer(savingsEnvelope.frozenUntil, now)) {
					throw new ConvexError({
						code: "ENVELOPE_FROZEN",
						message: "El sobre de Ahorro está congelado. No puedes sacar dinero de él todavía.",
					});
				}
				if (savingsEnvelope.remainingAmount < step.rescueTransfer) {
					throw new ConvexError({
						code: "VALIDATION_ERROR",
						message: "Ya no hay saldo en Ahorro para completar el rescate.",
					});
				}

				await ctx.db.patch(savingsEnvelope._id, {
					remainingAmount: savingsEnvelope.remainingAmount - step.rescueTransfer,
				});
				await ctx.db.patch(wantsEnvelope._id, {
					remainingAmount: wantsEnvelope.remainingAmount + step.rescueTransfer,
				});

				savingsEnvelope = {
					...savingsEnvelope,
					remainingAmount: savingsEnvelope.remainingAmount - step.rescueTransfer,
				};
				wantsEnvelope = {
					...wantsEnvelope,
					remainingAmount: wantsEnvelope.remainingAmount + step.rescueTransfer,
				};
				continue;
			}

			if (step.kind === "freeze_wants") {
				const freezeDays = step.freezeDays ?? 3;
				await ctx.db.patch(wantsEnvelope._id, {
					frozenUntil: now + freezeDays * 24 * 60 * 60 * 1000,
				});
			}
		}

		await evaluateCommitmentCoverageForCycle(ctx, profile._id, cycle._id, now);

		return {
			success: true,
			appliedSteps: plan.steps.length,
			projectedCushionCents: plan.projectedCushionCents,
			canFullyResolve: plan.canFullyResolve,
		};
	},
});
