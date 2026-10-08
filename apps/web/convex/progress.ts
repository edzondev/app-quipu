import { ConvexError, type Infer, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	type AchievementId,
	buildAchievements,
	buildCycleChartBars,
	canUseAccentPreset,
	canUseTheme,
	countDaysWithoutSkipping,
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

async function loadDaysWithoutSkipping(
	ctx: QueryCtx,
	profileId: Id<"profiles">,
	now: number,
): Promise<number> {
	const rows = await ctx.db
		.query("expenses")
		.withIndex("by_profile_time", (q) =>
			q.eq("profileId", profileId).lte("timestamp", endOfLimaDayInclusive(now)),
		)
		.collect();
	return countDaysWithoutSkipping(
		rows.map((row) => row.timestamp),
		now,
	);
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
	const [history, registeredExpenseCount, daysWithoutSkipping] = await Promise.all([
		Promise.all(
			historyRows.map(async (row) => {
				const cycle = await ctx.db.get("financialCycles", row.cycleId);
				return {
					status: row.status,
					wantsWithinBudget: row.wantsWithinBudget,
					allCommitmentsCovered: row.allCommitmentsCovered,
					evaluatedAt: row.evaluatedAt,
					cycleStart: cycle === null ? null : cycle.startDate,
				};
			}),
		),
		activeCycle === null ? Promise.resolve(0) : countExpensesInCycle(ctx, activeCycle._id),
		loadDaysWithoutSkipping(ctx, profile._id, now),
	]);
	const currentCycle =
		activeCycle !== null && !historyRows.some((row) => row.cycleId === activeCycle._id)
			? { cycleStart: activeCycle.startDate }
			: null;

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
		chartBars: buildCycleChartBars(history, currentCycle),
		registeredExpenseCount,
		daysWithoutSkipping,
		achievements,
		achievementsDoneCount: achievements.filter((a) => a.state === "done").length,
		achievementsTotal: achievements.length,
		appearance: {
			theme: profile.appearanceTheme ?? "light",
			accent: "moss" as const,
			appIcon: "light" as const,
		},
	};
}

const progressAchievementValidator = v.object({
	id: v.union(
		v.literal("first_cycle_closed"),
		v.literal("emergency_fund_25"),
		v.literal("three_cycles_wants_discipline"),
		v.literal("six_times_all_covered"),
		v.literal("emergency_fund_complete"),
		v.literal("one_year_in_order"),
	),
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
	args: {},
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

export const getRewards = query({
	args: {},
	handler: async (ctx) => {
		const bundle = await getAuthenticatedProgressBundle(ctx);
		if (!bundle) return null;

		const { currentStreak, appearance } = bundle;

		return {
			currentStreak,
			appearance,
			rewards: [
				{
					id: "tinta_theme" as const,
					title: "Tema Tinta",
					description: "Modo oscuro sobrio · desbloqueado con 3 ciclos",
					unlocked: isRewardUnlocked("tintaTheme", currentStreak),
					requiredStreak: REWARD_THRESHOLDS.tintaTheme,
					active: appearance.theme === "tinta",
				},
				{
					id: "clay_accent" as const,
					title: "Acento Arcilla",
					description: "Paleta alterna · desbloqueado con 6 ciclos",
					unlocked: isRewardUnlocked("clayAccent", currentStreak),
					requiredStreak: REWARD_THRESHOLDS.clayAccent,
					// Accent picker retired; reward stays informational.
					active: false,
				},
				{
					id: "annual_report" as const,
					title: "Informe anual encuadernado",
					description: "Se desbloquea con 12 ciclos en orden",
					unlocked: isRewardUnlocked("annualReport", currentStreak),
					requiredStreak: REWARD_THRESHOLDS.annualReport,
					active: false,
					cyclesRemaining: Math.max(0, REWARD_THRESHOLDS.annualReport - currentStreak),
				},
			],
			accents: [
				{ id: "moss" as const, unlocked: true },
				{ id: "steel" as const, unlocked: true },
				{
					id: "clay" as const,
					unlocked: canUseAccentPreset("clay", currentStreak),
				},
			],
			themes: [
				{ id: "light" as const, unlocked: true },
				{
					id: "tinta" as const,
					unlocked: canUseTheme("tinta", currentStreak),
				},
			],
			appIcons: [
				{ id: "light" as const, unlocked: true },
				{ id: "dark" as const, unlocked: true },
			],
		};
	},
});

export const updateAppearance = mutation({
	args: {
		appearanceTheme: v.optional(v.union(v.literal("light"), v.literal("tinta"))),
		accentPreset: v.optional(v.union(v.literal("moss"), v.literal("steel"), v.literal("clay"))),
		appIconVariant: v.optional(v.union(v.literal("light"), v.literal("dark"))),
	},
	handler: async (ctx, args) => {
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
		const updates: {
			appearanceTheme?: "light" | "tinta";
			accentPreset?: "moss";
		} = {};

		if (args.appearanceTheme !== undefined) {
			updates.appearanceTheme = args.appearanceTheme;
		}
		if (args.accentPreset !== undefined) {
			updates.accentPreset = "moss";
		}

		if (Object.keys(updates).length > 0) {
			await ctx.db.patch(profile._id, updates);
		}

		return {
			appearance: {
				theme: updates.appearanceTheme ?? profile.appearanceTheme ?? "light",
				accent: "moss" as const,
				appIcon: "light" as const,
			},
		};
	},
});

export const getAppearance = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		return {
			theme: profile.appearanceTheme ?? "light",
			accent: "moss" as const,
			appIcon: "light" as const,
		};
	},
});
