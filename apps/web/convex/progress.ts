import { ConvexError, type Infer, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	accentPresetValidator,
	appearanceThemeValidator,
	appIconVariantValidator,
} from "./lib/appearanceValidators";
import { cycleCountsForStreakAndGreen } from "./lib/evaluateClosedCycle";
import {
	type AchievementId,
	achievementIdValidator,
	buildAchievements,
	buildCycleChartBars,
	canUseAccentPreset,
	canUseTheme,
	countLoggingStreak,
	endOfLimaDayInclusive,
	isRewardUnlocked,
	progressChartBarValidator,
	REWARD_THRESHOLDS,
} from "./lib/gamificationMath";
import {
	computeEmergencyFundTargetCents,
	computeMonthlyEssentialsCents,
	computeProgressPercent,
	resolveEmergencyFundTargetCents,
} from "./lib/savingsMath";

async function countExpensesInCycle(
	ctx: QueryCtx,
	cycleId: Id<"financialCycles">,
): Promise<number> {
	const rows = await ctx.db
		.query("expenses")
		.withIndex("by_cycle_time", (q) => q.eq("cycleId", cycleId))
		.collect();
	return rows.length;
}

async function* expenseTimestampsNewestFirst(
	ctx: QueryCtx,
	profileId: Id<"profiles">,
	now: number,
): AsyncGenerator<number> {
	const expenses = ctx.db
		.query("expenses")
		.withIndex("by_profile_time", (q) =>
			q.eq("profileId", profileId).lte("timestamp", endOfLimaDayInclusive(now)),
		)
		.order("desc");
	for await (const expense of expenses) {
		yield expense.timestamp;
	}
}

async function loadDaysWithoutSkipping(
	ctx: QueryCtx,
	profileId: Id<"profiles">,
	now: number,
): Promise<number> {
	return countLoggingStreak(expenseTimestampsNewestFirst(ctx, profileId, now), now);
}

const ACHIEVEMENT_TITLES: Record<AchievementId, string> = {
	first_cycle_closed: "Primer ciclo cerrado",
	emergency_fund_25: "Fondo al 25%",
	three_cycles_wants_discipline: "3 ciclos sin exceder Gustos",
	six_times_all_covered: "Todo cubierto, 6 veces",
	emergency_fund_complete: "Fondo completo · 3 meses",
	one_year_in_order: "Un año en orden",
};

async function getAuthenticatedProgressBundle(ctx: QueryCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;

	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
		.unique();
	if (!profile) return null;

	const [streak, historyRows, emergencyFund, commitments, activeCycle] = await Promise.all([
		ctx.db
			.query("streaks")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.unique(),
		ctx.db
			.query("cycleHistory")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.collect(),
		ctx.db
			.query("subEnvelopes")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.filter((q) => q.eq(q.field("isSystemDefault"), true))
			.first(),
		ctx.db
			.query("fixedCommitments")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.collect(),
		ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique(),
	]);

	const monthlyEssentialsCents = computeMonthlyEssentialsCents(
		commitments.filter((c) => c.envelope === "needs"),
		activeCycle?.totalIncomeReceived ?? 0,
	);
	const computedTarget = computeEmergencyFundTargetCents(monthlyEssentialsCents);
	const targetCents = emergencyFund
		? resolveEmergencyFundTargetCents(emergencyFund.targetAmount, computedTarget)
		: computedTarget;
	const currentCents = emergencyFund?.currentAmount ?? 0;
	const progressPercent = computeProgressPercent(currentCents, targetCents);

	const now = Date.now();
	const history = historyRows.map((row) => ({
		status: row.status,
		wantsWithinBudget: row.wantsWithinBudget,
		allCommitmentsCovered: row.allCommitmentsCovered,
		evaluatedAt: row.evaluatedAt,
	}));
	const currentCycle =
		activeCycle !== null && !historyRows.some((row) => row.cycleId === activeCycle._id)
			? { cycleStart: activeCycle.startDate }
			: null;
	const chartRows = [...historyRows].sort((a, b) => a.evaluatedAt - b.evaluatedAt).slice(-12);
	const [chartHistory, registeredExpenseCount, daysWithoutSkipping] = await Promise.all([
		Promise.all(
			chartRows.map(async (row) => {
				const cycle = await ctx.db.get("financialCycles", row.cycleId);
				return {
					status: row.status,
					evaluatedAt: row.evaluatedAt,
					cycleStart: cycle === null ? null : cycle.startDate,
					countsForStreak:
						cycle !== null &&
						cycleCountsForStreakAndGreen({
							isOpeningCycle: cycle.isOpeningCycle,
							startDate: cycle.startDate,
							closeAt: row.evaluatedAt,
						}),
				};
			}),
		),
		activeCycle === null ? Promise.resolve(0) : countExpensesInCycle(ctx, activeCycle._id),
		loadDaysWithoutSkipping(ctx, profile._id, now),
	]);

	const currentStreak = streak?.currentStreak ?? 0;
	const formatRemaining = (cents: number) =>
		`${profile.currencySymbol} ${(cents / 100).toLocaleString("es-PE", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		})}`;

	const achievements = buildAchievements({
		history,
		emergencyFundProgressPercent: progressPercent,
		emergencyFundTargetCents: targetCents,
		emergencyFundCurrentCents: currentCents,
		currentStreak,
		formatRemaining,
	}).map((achievement) => ({
		...achievement,
		title: ACHIEVEMENT_TITLES[achievement.id],
	}));

	return {
		profile,
		currentStreak,
		longestStreak: streak?.longestStreak ?? 0,
		chartBars: buildCycleChartBars(chartHistory, currentCycle),
		registeredExpenseCount,
		daysWithoutSkipping,
		achievements,
		achievementsDoneCount: achievements.filter((a) => a.state === "done").length,
		achievementsTotal: achievements.length,
		appearance: progressAppearance(profile.appearanceTheme),
	};
}

const progressAchievementValidator = v.object({
	id: achievementIdValidator,
	title: v.string(),
	state: v.union(v.literal("done"), v.literal("locked")),
	earnedAt: v.union(v.number(), v.null()),
	lockedHint: v.union(v.string(), v.null()),
});

const progressOverviewValidator = v.nullable(
	v.object({
		currentStreak: v.number(),
		longestStreak: v.number(),
		chartBars: v.array(progressChartBarValidator),
		achievements: v.array(progressAchievementValidator),
		achievementsDoneCount: v.number(),
		achievementsTotal: v.number(),
		registeredExpenseCount: v.number(),
		daysWithoutSkipping: v.number(),
	}),
);

export const getOverview = query({
	// Cache key only. The server reads the clock; a new Lima day re-subscribes the client.
	args: { limaDay: v.optional(v.string()) },
	returns: progressOverviewValidator,
	handler: async (ctx): Promise<Infer<typeof progressOverviewValidator>> => {
		const bundle = await getAuthenticatedProgressBundle(ctx);
		if (!bundle) return null;

		return {
			currentStreak: bundle.currentStreak,
			longestStreak: bundle.longestStreak,
			chartBars: bundle.chartBars,
			achievements: bundle.achievements,
			achievementsDoneCount: bundle.achievementsDoneCount,
			achievementsTotal: bundle.achievementsTotal,
			registeredExpenseCount: bundle.registeredExpenseCount,
			daysWithoutSkipping: bundle.daysWithoutSkipping,
		};
	},
});

const progressAppearanceValidator = v.object({
	theme: appearanceThemeValidator,
	accent: v.literal("moss"),
	appIcon: v.literal("light"),
});

function progressAppearance(
	theme: Infer<typeof appearanceThemeValidator> | undefined,
): Infer<typeof progressAppearanceValidator> {
	return {
		theme: theme ?? "light",
		accent: "moss",
		appIcon: "light",
	};
}

const progressRewardFields = {
	title: v.string(),
	description: v.string(),
	unlocked: v.boolean(),
	requiredStreak: v.number(),
	active: v.boolean(),
};

const progressRewardValidator = v.union(
	v.object({ id: v.literal("tinta_theme"), ...progressRewardFields }),
	v.object({ id: v.literal("clay_accent"), ...progressRewardFields }),
	v.object({
		id: v.literal("annual_report"),
		...progressRewardFields,
		cyclesRemaining: v.number(),
	}),
);

const progressRewardsValidator = v.nullable(
	v.object({
		currentStreak: v.number(),
		appearance: progressAppearanceValidator,
		rewards: v.array(progressRewardValidator),
		accents: v.array(
			v.object({
				id: accentPresetValidator,
				unlocked: v.boolean(),
			}),
		),
		themes: v.array(
			v.object({
				id: appearanceThemeValidator,
				unlocked: v.boolean(),
			}),
		),
		appIcons: v.array(
			v.object({
				id: appIconVariantValidator,
				unlocked: v.boolean(),
			}),
		),
	}),
);

export const getRewards = query({
	args: {},
	returns: progressRewardsValidator,
	handler: async (ctx): Promise<Infer<typeof progressRewardsValidator>> => {
		const bundle = await getAuthenticatedProgressBundle(ctx);
		if (!bundle) return null;

		const { currentStreak, appearance } = bundle;

		return {
			currentStreak,
			appearance,
			rewards: [
				{
					id: "tinta_theme",
					title: "Tema Tinta",
					description: "Modo oscuro sobrio · desbloqueado con 3 ciclos",
					unlocked: isRewardUnlocked("tintaTheme", currentStreak),
					requiredStreak: REWARD_THRESHOLDS.tintaTheme,
					active: appearance.theme === "tinta",
				},
				{
					id: "clay_accent",
					title: "Acento Arcilla",
					description: "Paleta alterna · desbloqueado con 6 ciclos",
					unlocked: isRewardUnlocked("clayAccent", currentStreak),
					requiredStreak: REWARD_THRESHOLDS.clayAccent,
					// Accent picker retired; reward stays informational.
					active: false,
				},
				{
					id: "annual_report",
					title: "Informe anual encuadernado",
					description: "Se desbloquea con 12 ciclos en orden",
					unlocked: isRewardUnlocked("annualReport", currentStreak),
					requiredStreak: REWARD_THRESHOLDS.annualReport,
					active: false,
					cyclesRemaining: Math.max(0, REWARD_THRESHOLDS.annualReport - currentStreak),
				},
			],
			accents: [
				{ id: "moss", unlocked: true },
				{ id: "steel", unlocked: true },
				{
					id: "clay",
					unlocked: canUseAccentPreset("clay", currentStreak),
				},
			],
			themes: [
				{ id: "light", unlocked: true },
				{
					id: "tinta",
					unlocked: canUseTheme("tinta", currentStreak),
				},
			],
			appIcons: [
				{ id: "light", unlocked: true },
				{ id: "dark", unlocked: true },
			],
		};
	},
});

const updateAppearanceResultValidator = v.object({
	appearance: progressAppearanceValidator,
});

export const updateAppearance = mutation({
	args: {
		appearanceTheme: v.optional(appearanceThemeValidator),
		accentPreset: v.optional(accentPresetValidator),
		appIconVariant: v.optional(appIconVariantValidator),
	},
	returns: updateAppearanceResultValidator,
	handler: async (ctx, args): Promise<Infer<typeof updateAppearanceResultValidator>> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión.",
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

		// Dark mode is available from Preferencias without a streak gate.
		// Accent and app icon are no longer user-selectable; keep moss + ignore icons.
		if (args.appearanceTheme !== undefined || args.accentPreset !== undefined) {
			await ctx.db.patch(profile._id, {
				...(args.appearanceTheme !== undefined ? { appearanceTheme: args.appearanceTheme } : {}),
				...(args.accentPreset !== undefined ? { accentPreset: "moss" } : {}),
			});
		}

		return {
			appearance: progressAppearance(args.appearanceTheme ?? profile.appearanceTheme),
		};
	},
});

const getAppearanceResultValidator = v.nullable(progressAppearanceValidator);

export const getAppearance = query({
	args: {},
	returns: getAppearanceResultValidator,
	handler: async (ctx): Promise<Infer<typeof getAppearanceResultValidator>> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		return progressAppearance(profile.appearanceTheme);
	},
});
