import { type Infer, v } from "convex/values";
import { query } from "./_generated/server";
import {
	buildCycleCloseReport,
	isCloseReportEligible,
	isJustClosedAfterCycleClose,
} from "./lib/cycleCloseReport";
import { computeCycleDayMetrics } from "./lib/dashboardMath";
import { cycleCountsForStreakAndGreen } from "./lib/evaluateClosedCycle";

const envelopeSpendValidator = v.object({
	type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
	label: v.string(),
	spentCents: v.number(),
});

const reportValidator = v.object({
	closedCycleId: v.id("financialCycles"),
	cycleLabel: v.string(),
	totalIncomeCents: v.number(),
	spendByEnvelope: v.array(envelopeSpendValidator),
	savingsCents: v.number(),
	streak: v.number(),
	streakEvaluated: v.boolean(),
	status: v.union(v.literal("compliant"), v.literal("warning"), v.literal("failed")),
	hasExtraordinaryIncome: v.boolean(),
});

const latestCloseReportValidator = v.nullable(
	v.object({
		justClosed: v.boolean(),
		report: reportValidator,
	}),
);

export const getLatestCloseReport = query({
	args: {},
	returns: latestCloseReportValidator,
	handler: async (ctx): Promise<Infer<typeof latestCloseReportValidator>> => {
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

		const historyRows = await ctx.db
			.query("cycleHistory")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.collect();

		if (historyRows.length === 0) return null;

		const latestHistory = historyRows.reduce((latest, row) =>
			row.evaluatedAt > latest.evaluatedAt ? row : latest,
		);

		if (latestHistory.cycleId === activeCycle._id) return null;
		if (!isCloseReportEligible(latestHistory.closedAtPremium)) return null;

		const closedCycle = await ctx.db.get("financialCycles", latestHistory.cycleId);
		if (!closedCycle) return null;

		const now = Date.now();
		const { daysElapsed } = computeCycleDayMetrics(activeCycle.startDate, activeCycle.endDate, now);
		const justClosed = isJustClosedAfterCycleClose({
			activeCycleDaysElapsed: daysElapsed,
			closedCycleEvaluatedAt: latestHistory.evaluatedAt,
			now,
		});

		const [envelopes, incomeEvents, streakRow] = await Promise.all([
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", latestHistory.cycleId))
				.collect(),
			ctx.db
				.query("incomeEvents")
				.withIndex("by_cycle", (q) => q.eq("cycleId", latestHistory.cycleId))
				.collect(),
			ctx.db
				.query("streaks")
				.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
				.unique(),
		]);

		const report = buildCycleCloseReport({
			cycleStartDate: closedCycle.startDate,
			incomeEvents: incomeEvents.map((event) => ({
				amount: event.amount,
				incomeKind: event.incomeKind,
			})),
			envelopes: envelopes.map((envelope) => ({
				type: envelope.type,
				allocatedAmount: envelope.allocatedAmount,
				remainingAmount: envelope.remainingAmount,
			})),
			cycleHistory: { status: latestHistory.status },
			streak: streakRow?.currentStreak ?? 0,
		});

		return {
			justClosed,
			report: {
				closedCycleId: latestHistory.cycleId,
				...report,
				streakEvaluated: cycleCountsForStreakAndGreen({
					isOpeningCycle: closedCycle.isOpeningCycle,
					startDate: closedCycle.startDate,
					closeAt: latestHistory.evaluatedAt,
				}),
			},
		};
	},
});
