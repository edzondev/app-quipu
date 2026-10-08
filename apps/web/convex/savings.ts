import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { creditSubEnvelopeFromSurplus } from "./lib/creditSurplusContribution";
import {
	buildCycleSavingsContextLabel,
	computeCycleSavingsBreakdown,
} from "./lib/cycleSavingsBreakdown";
import { computeAvailableExtraordinarySavingsForMove } from "./lib/extraordinarySavingsSurplus";
import {
	buildSavingsAssignPlan,
	SAVINGS_ASSIGN_RATIONALES,
	validateSavingsAssignLines,
} from "./lib/savingsAssignPlan";
import {
	buildMonthsCoveredCopy,
	compareSavingsSubEnvelopes,
	computeCyclesToComplete,
	computeEmergencyFundTargetCents,
	computeMonthlyEssentialsCents,
	computeMonthsCovered,
	computeProgressPercent,
	computeRemainingToTarget,
	MAX_SAVINGS_GOALS,
	resolveEmergencyFundTargetCents,
} from "./lib/savingsMath";
import { surplusFromEnvelopeValidator } from "./lib/surplusValidators";

function mapGoal(subEnvelope: Doc<"subEnvelopes">) {
	const targetAmount = subEnvelope.targetAmount ?? 0;
	return {
		id: subEnvelope._id,
		label: subEnvelope.label,
		currentAmount: subEnvelope.currentAmount,
		targetAmount: subEnvelope.targetAmount,
		progressPercent: computeProgressPercent(subEnvelope.currentAmount, targetAmount),
		isSystemDefault: subEnvelope.isSystemDefault,
	};
}

function buildEmergencyFundPayload({
	emergencyFund,
	monthlyEssentialsCents,
	cycleContributionCents,
	contributionStreak,
	availableToContributeCents,
}: {
	emergencyFund: Doc<"subEnvelopes">;
	monthlyEssentialsCents: number;
	cycleContributionCents: number;
	contributionStreak: number;
	availableToContributeCents: number;
}) {
	const computedTargetCents = computeEmergencyFundTargetCents(monthlyEssentialsCents);
	const targetCents = resolveEmergencyFundTargetCents(
		emergencyFund.targetAmount,
		computedTargetCents,
	);
	const monthsCovered = computeMonthsCovered(emergencyFund.currentAmount, monthlyEssentialsCents);
	const remainingCents = computeRemainingToTarget(emergencyFund.currentAmount, targetCents);
	const cyclesToComplete = computeCyclesToComplete(remainingCents, cycleContributionCents);

	return {
		id: emergencyFund._id,
		label: emergencyFund.label,
		currentAmount: emergencyFund.currentAmount,
		targetAmount: targetCents,
		monthlyEssentialsCents,
		monthsCovered,
		monthsCoveredCopy: buildMonthsCoveredCopy(monthsCovered),
		progressPercent: computeProgressPercent(emergencyFund.currentAmount, targetCents),
		cycleContributionCents,
		cyclesToComplete,
		contributionStreak,
		availableToContributeCents,
	};
}

async function buildSavingsOverview(ctx: QueryCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;

	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
		.unique();
	if (!profile) return null;

	const [subEnvelopes, commitments, activeCycle, streak] = await Promise.all([
		ctx.db
			.query("subEnvelopes")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.collect(),
		ctx.db
			.query("fixedCommitments")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.collect(),
		ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique(),
		ctx.db
			.query("streaks")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.unique(),
	]);

	let savingsEnvelopeRemaining = 0;
	let cycleContributionCents = 0;
	let needsEnvelopeAllocated = 0;
	if (activeCycle) {
		const [savingsEnvelope, needsEnvelope] = await Promise.all([
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "savings"))
				.unique(),
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "needs"))
				.unique(),
		]);
		savingsEnvelopeRemaining = Math.max(0, savingsEnvelope?.remainingAmount ?? 0);
		cycleContributionCents = Math.max(0, savingsEnvelope?.allocatedAmount ?? 0);
		needsEnvelopeAllocated = Math.max(0, needsEnvelope?.allocatedAmount ?? 0);
	}

	const monthlyEssentialsCents = computeMonthlyEssentialsCents(
		commitments.filter((commitment) => commitment.envelope === "needs"),
		needsEnvelopeAllocated,
	);

	const emergencyFund =
		subEnvelopes.find((subEnvelope) => subEnvelope.isSystemDefault) ?? subEnvelopes[0];

	if (!emergencyFund) {
		return {
			profile: {
				name: profile.name,
				currencyCode: profile.currencyCode,
			},
			hasActiveCycle: Boolean(activeCycle),
			totalSavedCents: 0,
			cycleContributionCents,
			emergencyFund: null,
			goals: [],
			canCreateGoal: false,
			assignPlan: null,
		};
	}

	const goalCandidates = subEnvelopes.filter((subEnvelope) => !subEnvelope.isSystemDefault);
	goalCandidates.sort((a, b) => b.currentAmount - a.currentAmount);
	const goals = goalCandidates.slice(0, MAX_SAVINGS_GOALS).map(mapGoal);

	const emergencyFundPayload = buildEmergencyFundPayload({
		emergencyFund,
		monthlyEssentialsCents,
		cycleContributionCents,
		contributionStreak: streak?.currentStreak ?? 0,
		availableToContributeCents: savingsEnvelopeRemaining,
	});

	const assignPlan = buildSavingsAssignPlan({
		availableCents: savingsEnvelopeRemaining,
		emergencyFund: {
			subEnvelopeId: emergencyFund._id,
			label: emergencyFund.label,
			currentAmount: emergencyFund.currentAmount,
			targetAmount: emergencyFundPayload.targetAmount,
		},
		goals: goals.map((goal) => ({
			subEnvelopeId: goal.id,
			label: goal.label,
			currentAmount: goal.currentAmount,
			targetAmount: goal.targetAmount ?? 0,
		})),
	});

	const totalSavedCents = subEnvelopes.reduce(
		(sum, subEnvelope) => sum + subEnvelope.currentAmount,
		0,
	);

	return {
		profile: {
			name: profile.name,
			currencyCode: profile.currencyCode,
		},
		hasActiveCycle: Boolean(activeCycle),
		totalSavedCents,
		cycleContributionCents,
		emergencyFund: emergencyFundPayload,
		goals,
		assignPlan,
		canCreateGoal: goals.length < MAX_SAVINGS_GOALS,
	};
}

async function executeContribution(
	ctx: MutationCtx,
	subEnvelopeId: Id<"subEnvelopes">,
	amountArg?: number,
) {
	const { profile, activeCycle } = await getOwnedProfileAndActiveCycle(
		ctx,
		"Registra un ingreso para activar tu ciclo antes de aportar.",
	);

	const subEnvelopePromise = ctx.db.get(subEnvelopeId);
	const savingsEnvelopePromise = ctx.db
		.query("envelopes")
		.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "savings"))
		.unique();
	const [subEnvelope, savingsEnvelope] = await Promise.all([
		subEnvelopePromise,
		savingsEnvelopePromise,
	]);
	if (!subEnvelope || subEnvelope.profileId !== profile._id) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Meta de ahorro no encontrada.",
		});
	}
	if (!savingsEnvelope) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Sobre de ahorro no encontrado en el ciclo actual.",
		});
	}

	const available = Math.max(0, savingsEnvelope.remainingAmount);
	const amount = amountArg ?? available;

	if (!Number.isInteger(amount) || amount <= 0) {
		throw new ConvexError({
			code: "VALIDATION_ERROR",
			message: "El aporte debe ser un entero de céntimos mayor a cero.",
			data: { field: "amount" },
		});
	}
	if (amount > available) {
		throw new ConvexError({
			code: "INSUFFICIENT_FUNDS",
			message: "No tienes suficiente apartado en Ahorro para este aporte.",
			data: {
				envelope: "savings",
				requested: amount,
				available,
			},
		});
	}

	await ctx.db.patch(savingsEnvelope._id, {
		remainingAmount: savingsEnvelope.remainingAmount - amount,
	});
	await ctx.db.patch(subEnvelope._id, {
		currentAmount: subEnvelope.currentAmount + amount,
	});

	return {
		subEnvelopeId: subEnvelope._id,
		amount,
		newCurrentAmount: subEnvelope.currentAmount + amount,
		savingsRemainingAmount: savingsEnvelope.remainingAmount - amount,
	};
}

const cycleSavingsBreakdownValidator = v.object({
	currencyCode: v.string(),
	cycleContextLabel: v.string(),
	allocationSavingsPercent: v.number(),
	savingsObjectiveCents: v.number(),
	savingsAdditionalCents: v.number(),
	savingsTotalCents: v.number(),
	savingsObjectiveTargetCents: v.number(),
	savingsObjectiveContributedCents: v.number(),
	savingsCycleContributedCents: v.number(),
	savingsEnvelopeRemainingCents: v.number(),
	savingsSetAsideCents: v.number(),
	savingsRemainingCents: v.number(),
	objectiveProgressPercent: v.number(),
	objectiveBarPercent: v.number(),
	additionalBarPercent: v.number(),
	status: v.union(
		v.literal("on_track"),
		v.literal("above_objective"),
		v.literal("below_objective"),
	),
	showAboveTargetCelebration: v.boolean(),
	showUnderTargetMessage: v.boolean(),
	aboveTargetByCents: v.number(),
	underTargetByCents: v.number(),
	wantsSurplusCents: v.number(),
	needsSurplusCents: v.number(),
	extraordinarySurplusCents: v.number(),
});

async function buildCycleSavingsBreakdown(ctx: QueryCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;

	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
		.unique();
	if (!profile) return null;

	const activeCycle = await ctx.db
		.query("financialCycles")
		.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
		.unique();
	if (!activeCycle) return null;

	const [incomeEvents, surplusContributions, envelopes, allocationLines] = await Promise.all([
		ctx.db
			.query("incomeEvents")
			.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
			.collect(),
		ctx.db
			.query("surplusContributions")
			.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
			.collect(),
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
			.collect(),
		ctx.db
			.query("incomeAllocationLines")
			.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
			.collect(),
	]);

	const breakdownEvents = incomeEvents.map((event) => ({
		incomeKind: event.incomeKind,
		distributionPolicy: event.distributionPolicy,
		distributionApplied: event.distributionApplied,
	}));

	const savingsEnvelope = envelopes.find((envelope) => envelope.type === "savings");
	const wantsEnvelope = envelopes.find((envelope) => envelope.type === "wants");
	const needsEnvelope = envelopes.find((envelope) => envelope.type === "needs");

	const numbers = computeCycleSavingsBreakdown({
		incomeEvents: breakdownEvents,
		surplusContributions: surplusContributions.map((row) => ({
			amount: row.amount,
			contributionKind: row.contributionKind,
		})),
		allocationLines: allocationLines.map((row) => ({
			destination: row.destination,
			amountCents: row.amountCents,
			contributionKind: row.contributionKind,
		})),
		savingsEnvelope: savingsEnvelope
			? {
					allocatedAmount: savingsEnvelope.allocatedAmount,
					remainingAmount: savingsEnvelope.remainingAmount,
				}
			: null,
	});
	const cycleContextLabel = buildCycleSavingsContextLabel(activeCycle.startDate, breakdownEvents);

	const underTargetByCents = Math.max(
		0,
		numbers.savingsObjectiveTargetCents - numbers.savingsObjectiveContributedCents,
	);

	const extraordinarySurplusCents = computeAvailableExtraordinarySavingsForMove({
		incomeEvents: breakdownEvents.map((event) => ({
			incomeKind: event.incomeKind,
			distributionApplied: event.distributionApplied,
		})),
		surplusContributions: surplusContributions.map((row) => ({
			fromEnvelope: row.fromEnvelope,
			amount: row.amount,
		})),
		savingsEnvelopeRemainingCents: Math.max(0, savingsEnvelope?.remainingAmount ?? 0),
	});

	return {
		currencyCode: profile.currencyCode,
		cycleContextLabel,
		allocationSavingsPercent: profile.allocationSavings,
		wantsSurplusCents: Math.max(0, wantsEnvelope?.remainingAmount ?? 0),
		needsSurplusCents: Math.max(0, needsEnvelope?.remainingAmount ?? 0),
		extraordinarySurplusCents,
		showAboveTargetCelebration: numbers.status === "above_objective",
		showUnderTargetMessage: numbers.status === "below_objective",
		aboveTargetByCents: numbers.savingsAdditionalCents,
		underTargetByCents,
		...numbers,
		savingsRemainingCents: Math.max(0, savingsEnvelope?.remainingAmount ?? 0),
	};
}

const savingsProfileValidator = v.object({
	name: v.string(),
	currencyCode: v.string(),
});

const savingsGoalValidator = v.object({
	id: v.id("subEnvelopes"),
	label: v.string(),
	currentAmount: v.number(),
	targetAmount: v.optional(v.number()),
	progressPercent: v.number(),
	isSystemDefault: v.boolean(),
});

const emergencyFundValidator = v.object({
	id: v.id("subEnvelopes"),
	label: v.string(),
	currentAmount: v.number(),
	targetAmount: v.number(),
	monthlyEssentialsCents: v.number(),
	monthsCovered: v.number(),
	monthsCoveredCopy: v.string(),
	progressPercent: v.number(),
	cycleContributionCents: v.number(),
	cyclesToComplete: v.nullable(v.number()),
	contributionStreak: v.number(),
	availableToContributeCents: v.number(),
});

const savingsAssignPlanValidator = v.object({
	lines: v.array(
		v.object({
			subEnvelopeId: v.string(),
			label: v.string(),
			suggestedCents: v.number(),
			remainingToTargetCents: v.number(),
		}),
	),
	totalCents: v.number(),
	rationale: v.union(...SAVINGS_ASSIGN_RATIONALES.map((rationale) => v.literal(rationale))),
});

const savingsOverviewValidator = v.object({
	profile: savingsProfileValidator,
	hasActiveCycle: v.boolean(),
	totalSavedCents: v.number(),
	cycleContributionCents: v.number(),
	emergencyFund: v.nullable(emergencyFundValidator),
	goals: v.array(savingsGoalValidator),
	canCreateGoal: v.boolean(),
	assignPlan: v.nullable(savingsAssignPlanValidator),
});

const emergencyFundDetailValidator = v.object({
	profile: savingsProfileValidator,
	hasActiveCycle: v.boolean(),
	emergencyFund: emergencyFundValidator,
});

export const getOverview = query({
	args: {},
	returns: v.nullable(savingsOverviewValidator),
	handler: async (ctx) => buildSavingsOverview(ctx),
});

export const getCycleSavingsBreakdown = query({
	args: {},
	returns: v.union(cycleSavingsBreakdownValidator, v.null()),
	handler: async (ctx) => buildCycleSavingsBreakdown(ctx),
});

export const getEmergencyFundDetail = query({
	args: {},
	returns: v.nullable(emergencyFundDetailValidator),
	handler: async (ctx) => {
		const overview = await buildSavingsOverview(ctx);
		if (!overview?.emergencyFund) return null;

		return {
			profile: overview.profile,
			hasActiveCycle: overview.hasActiveCycle,
			emergencyFund: overview.emergencyFund,
		};
	},
});

export const contributeToSubEnvelope = mutation({
	args: {
		subEnvelopeId: v.id("subEnvelopes"),
		amount: v.optional(v.number()),
	},
	handler: async (ctx, args) => executeContribution(ctx, args.subEnvelopeId, args.amount),
});

export const assignSavingsEnvelope = mutation({
	args: {
		lines: v.array(
			v.object({
				subEnvelopeId: v.id("subEnvelopes"),
				amount: v.number(),
			}),
		),
	},
	returns: v.object({
		assignedCents: v.number(),
		savingsRemainingCents: v.number(),
		results: v.array(
			v.object({
				subEnvelopeId: v.id("subEnvelopes"),
				label: v.string(),
				amount: v.number(),
				newCurrentAmount: v.number(),
			}),
		),
	}),
	handler: async (ctx, args) => {
		const { profile, activeCycle } = await getOwnedProfileAndActiveCycle(ctx);

		const savingsEnvelope = await ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "savings"))
			.unique();
		if (!savingsEnvelope) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Sobre de ahorro no encontrado en el ciclo actual.",
			});
		}
		const available = Math.max(0, savingsEnvelope.remainingAmount);

		const subEnvelopes = await ctx.db
			.query("subEnvelopes")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.collect();

		const validLines = validateSavingsAssignLines(
			args.lines.map((line) => ({
				subEnvelopeId: line.subEnvelopeId as string,
				amount: line.amount,
			})),
			{
				availableCents: available,
				ownedIds: subEnvelopes.map((subEnvelope) => subEnvelope._id),
			},
		);

		const total = validLines.reduce((sum, line) => sum + line.amount, 0);
		await ctx.db.patch(savingsEnvelope._id, {
			remainingAmount: savingsEnvelope.remainingAmount - total,
		});

		const results = await Promise.all(
			validLines.map(async (line) => {
				const subEnvelope = await ctx.db.get(line.subEnvelopeId as Id<"subEnvelopes">);
				if (!subEnvelope) {
					throw new ConvexError({
						code: "NOT_FOUND",
						message: "Meta de ahorro no encontrada.",
					});
				}
				await ctx.db.patch(subEnvelope._id, {
					currentAmount: subEnvelope.currentAmount + line.amount,
				});
				return {
					subEnvelopeId: subEnvelope._id,
					label: subEnvelope.label,
					amount: line.amount,
					newCurrentAmount: subEnvelope.currentAmount + line.amount,
				};
			}),
		);

		return {
			assignedCents: total,
			savingsRemainingCents: savingsEnvelope.remainingAmount - total,
			results,
		};
	},
});

export const createSavingsGoal = mutation({
	args: {
		label: v.string(),
		targetAmount: v.optional(v.number()),
	},
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

		const label = args.label.trim();
		if (!label) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El nombre de la meta es obligatorio.",
				data: { field: "label" },
			});
		}
		if (label.length > 40) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El nombre de la meta debe tener como máximo 40 caracteres.",
				data: { field: "label" },
			});
		}

		if (
			args.targetAmount !== undefined &&
			(!Number.isInteger(args.targetAmount) || args.targetAmount <= 0)
		) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "La meta debe ser un entero de céntimos mayor a cero.",
				data: { field: "targetAmount" },
			});
		}

		const existingGoals = await ctx.db
			.query("subEnvelopes")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.collect();

		const customGoals = existingGoals.filter((subEnvelope) => !subEnvelope.isSystemDefault);
		if (customGoals.length >= MAX_SAVINGS_GOALS) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Ya tienes el máximo de metas visibles. Cierra una antes de crear otra.",
			});
		}

		const duplicate = customGoals.some((goal) => goal.label.toLowerCase() === label.toLowerCase());
		if (duplicate) {
			throw new ConvexError({
				code: "ALREADY_EXISTS",
				message: "Ya tienes una meta con ese nombre.",
			});
		}

		const goalId = await ctx.db.insert("subEnvelopes", {
			profileId: profile._id,
			parentEnvelopeType: "savings",
			label,
			emoji: "",
			currentAmount: 0,
			targetAmount: args.targetAmount,
			isSystemDefault: false,
		});

		return { goalId };
	},
});

const moveSurplusSourceValidator = v.object({
	availableCents: v.number(),
});

async function getOwnedProfileAndActiveCycle(
	ctx: QueryCtx | MutationCtx,
	noCycleMessage = "Registra un ingreso para activar tu ciclo antes de mover sobrante.",
) {
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
			code: "NO_ACTIVE_CYCLE",
			message: noCycleMessage,
		});
	}

	return { profile, activeCycle };
}

export const getMoveSurplusContext = query({
	args: {},
	returns: v.union(
		v.null(),
		v.object({
			currencyCode: v.string(),
			sources: v.object({
				needs: moveSurplusSourceValidator,
				wants: moveSurplusSourceValidator,
				extraordinary: moveSurplusSourceValidator,
			}),
			destinations: v.array(
				v.object({
					id: v.id("subEnvelopes"),
					label: v.string(),
					isSystemDefault: v.boolean(),
				}),
			),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activeCycle) return null;

		const [
			needsEnvelope,
			wantsEnvelope,
			savingsEnvelope,
			subEnvelopes,
			incomeEvents,
			surplusContributions,
		] = await Promise.all([
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "needs"))
				.unique(),
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "wants"))
				.unique(),
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "savings"))
				.unique(),
			ctx.db
				.query("subEnvelopes")
				.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
				.collect(),
			ctx.db
				.query("incomeEvents")
				.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
				.collect(),
			ctx.db
				.query("surplusContributions")
				.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
				.collect(),
		]);

		const destinations = subEnvelopes
			.slice()
			.sort(compareSavingsSubEnvelopes)
			.map((subEnvelope) => ({
				id: subEnvelope._id,
				label: subEnvelope.label,
				isSystemDefault: subEnvelope.isSystemDefault,
			}));

		if (destinations.length === 0) return null;

		const breakdownEvents = incomeEvents.map((event) => ({
			incomeKind: event.incomeKind,
			distributionApplied: event.distributionApplied,
		}));
		const extraordinaryAvailable = computeAvailableExtraordinarySavingsForMove({
			incomeEvents: breakdownEvents,
			surplusContributions: surplusContributions.map((row) => ({
				fromEnvelope: row.fromEnvelope,
				amount: row.amount,
			})),
			savingsEnvelopeRemainingCents: Math.max(0, savingsEnvelope?.remainingAmount ?? 0),
		});

		return {
			currencyCode: profile.currencyCode,
			sources: {
				needs: {
					availableCents: Math.max(0, needsEnvelope?.remainingAmount ?? 0),
				},
				wants: {
					availableCents: Math.max(0, wantsEnvelope?.remainingAmount ?? 0),
				},
				extraordinary: {
					availableCents: extraordinaryAvailable,
				},
			},
			destinations,
		};
	},
});

async function resolveDefaultFundSubEnvelopeId(
	ctx: MutationCtx,
	profileId: Id<"profiles">,
): Promise<Id<"subEnvelopes">> {
	const subEnvelopes = await ctx.db
		.query("subEnvelopes")
		.withIndex("by_profile", (q) => q.eq("profileId", profileId))
		.collect();
	const fund =
		subEnvelopes.find((subEnvelope) => subEnvelope.isSystemDefault) ??
		subEnvelopes.find((subEnvelope) => subEnvelope.parentEnvelopeType === "savings");
	if (!fund) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "No encontramos tu Fondo de emergencia.",
		});
	}
	return fund._id;
}

export const moveSurplusToSavings = mutation({
	args: {
		fromEnvelope: surplusFromEnvelopeValidator,
		amount: v.number(),
		toSubEnvelopeId: v.optional(v.id("subEnvelopes")),
	},
	returns: v.object({
		amount: v.number(),
		fromEnvelope: surplusFromEnvelopeValidator,
		subEnvelopeId: v.id("subEnvelopes"),
		subEnvelopeLabel: v.string(),
		savingsObjectiveCents: v.number(),
		savingsAdditionalCents: v.number(),
		savingsTotalCents: v.number(),
		allocationNeeds: v.number(),
		allocationWants: v.number(),
		allocationSavings: v.number(),
	}),
	handler: async (ctx, args) => {
		const { profile, activeCycle } = await getOwnedProfileAndActiveCycle(ctx);

		if (!Number.isInteger(args.amount) || args.amount <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El monto debe ser un entero de céntimos mayor a cero.",
				data: { field: "amount" },
			});
		}

		const targetSubEnvelopeId =
			args.toSubEnvelopeId ?? (await resolveDefaultFundSubEnvelopeId(ctx, profile._id));

		const subEnvelope = await ctx.db.get(targetSubEnvelopeId);
		if (
			!subEnvelope ||
			subEnvelope.profileId !== profile._id ||
			subEnvelope.parentEnvelopeType !== "savings"
		) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Meta de ahorro no encontrada.",
			});
		}

		if (args.fromEnvelope === "extraordinary") {
			const savingsEnvelope = await ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", "savings"))
				.unique();
			if (!savingsEnvelope) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "No se encontró el sobre de ahorro en el ciclo actual.",
				});
			}

			const [incomeEvents, surplusContributions] = await Promise.all([
				ctx.db
					.query("incomeEvents")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
				ctx.db
					.query("surplusContributions")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
			]);

			const available = computeAvailableExtraordinarySavingsForMove({
				incomeEvents: incomeEvents.map((event) => ({
					incomeKind: event.incomeKind,
					distributionApplied: event.distributionApplied,
				})),
				surplusContributions: surplusContributions.map((row) => ({
					fromEnvelope: row.fromEnvelope,
					amount: row.amount,
				})),
				savingsEnvelopeRemainingCents: Math.max(0, savingsEnvelope.remainingAmount),
			});

			if (args.amount > available) {
				throw new ConvexError({
					code: "INSUFFICIENT_ENVELOPE_BALANCE",
					message: "No puedes mover más del saldo disponible de gratificación.",
					data: {
						envelope: args.fromEnvelope,
						requested: args.amount,
						available,
					},
				});
			}

			await ctx.db.patch(savingsEnvelope._id, {
				remainingAmount: savingsEnvelope.remainingAmount - args.amount,
			});
		} else if (args.fromEnvelope === "needs" || args.fromEnvelope === "wants") {
			const fromType = args.fromEnvelope;
			const fromEnvelopeDoc = await ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id).eq("type", fromType))
				.unique();
			if (!fromEnvelopeDoc) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "No se encontró el sobre de origen en el ciclo actual.",
				});
			}

			const available = Math.max(0, fromEnvelopeDoc.remainingAmount);
			if (args.amount > available) {
				throw new ConvexError({
					code: "INSUFFICIENT_ENVELOPE_BALANCE",
					message: "No puedes mover más del sobrante disponible en ese sobre.",
					data: {
						envelope: args.fromEnvelope,
						requested: args.amount,
						available,
					},
				});
			}

			await ctx.db.patch(fromEnvelopeDoc._id, {
				remainingAmount: fromEnvelopeDoc.remainingAmount - args.amount,
			});
		} else {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Origen de sobrante no válido.",
				data: { field: "fromEnvelope" },
			});
		}
		await creditSubEnvelopeFromSurplus(ctx, {
			profileId: profile._id,
			cycleId: activeCycle._id,
			fromEnvelope: args.fromEnvelope,
			amount: args.amount,
			subEnvelopeId: subEnvelope._id,
			createdAt: Date.now(),
		});

		const [incomeEvents, surplusContributions, envelopesAfter, allocationLines] = await Promise.all(
			[
				ctx.db
					.query("incomeEvents")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
				ctx.db
					.query("surplusContributions")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
				ctx.db
					.query("envelopes")
					.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
				ctx.db
					.query("incomeAllocationLines")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
			],
		);

		const breakdownEvents = incomeEvents.map((event) => ({
			incomeKind: event.incomeKind,
			distributionPolicy: event.distributionPolicy,
			distributionApplied: event.distributionApplied,
		}));
		const savingsEnvelopeAfter = envelopesAfter.find((envelope) => envelope.type === "savings");
		const cycleNumbers = computeCycleSavingsBreakdown({
			incomeEvents: breakdownEvents,
			surplusContributions: surplusContributions.map((row) => ({
				amount: row.amount,
				contributionKind: row.contributionKind,
			})),
			allocationLines: allocationLines.map((row) => ({
				destination: row.destination,
				amountCents: row.amountCents,
				contributionKind: row.contributionKind,
			})),
			savingsEnvelope: savingsEnvelopeAfter
				? {
						allocatedAmount: savingsEnvelopeAfter.allocatedAmount,
						remainingAmount: savingsEnvelopeAfter.remainingAmount,
					}
				: null,
		});

		return {
			amount: args.amount,
			fromEnvelope: args.fromEnvelope,
			subEnvelopeId: subEnvelope._id,
			subEnvelopeLabel: subEnvelope.label,
			savingsObjectiveCents: cycleNumbers.savingsObjectiveCents,
			savingsAdditionalCents: cycleNumbers.savingsAdditionalCents,
			savingsTotalCents: cycleNumbers.savingsTotalCents,
			allocationNeeds: profile.allocationNeeds,
			allocationWants: profile.allocationWants,
			allocationSavings: profile.allocationSavings,
		};
	},
});
