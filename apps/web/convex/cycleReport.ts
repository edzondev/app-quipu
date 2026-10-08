import { type Infer, v } from "convex/values";
import { query } from "./_generated/server";
import {
	buildCycleCloseReport,
	isCloseReportEligible,
	isJustClosedAfterCycleClose,
} from "./lib/cycleCloseReport";
import { computeCycleDayMetrics } from "./lib/dashboardMath";
import {
	computeAvailableExtraordinarySavingsForMove,
	resolveSurplusMove,
} from "./lib/extraordinarySavingsSurplus";

const envelopeSpendValidator = v.object({
	type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
	label: v.string(),
	spentCents: v.number(),
});

const surplusFromEnvelopeValidator = v.union(
	v.literal("needs"),
	v.literal("wants"),
	v.literal("extraordinary"),
);

const moveSurplusValidator = v.union(
	v.null(),
	v.object({
		fromEnvelope: surplusFromEnvelopeValidator,
		amount: v.number(),
		toSubEnvelopeId: v.optional(v.id("subEnvelopes")),
	}),
);

const reportValidator = v.object({
	closedCycleId: v.id("financialCycles"),
	cycleLabel: v.string(),
	totalIncomeCents: v.number(),
	spendByEnvelope: v.array(envelopeSpendValidator),
	savingsCents: v.number(),
	streak: v.number(),
	status: v.union(v.literal("compliant"), v.literal("warning"), v.literal("failed")),
	hasExtraordinaryIncome: v.boolean(),
	expenseCount: v.number(),
	moveSurplus: moveSurplusValidator,
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

		const [envelopes, incomeEvents, streakRow, surplusContributions, subEnvelopes, cycleExpenses] =
			await Promise.all([
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
				ctx.db
					.query("surplusContributions")
					.withIndex("by_cycle", (q) => q.eq("cycleId", latestHistory.cycleId))
					.collect(),
				ctx.db
					.query("subEnvelopes")
					.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
					.collect(),
				ctx.db
					.query("expenses")
					.withIndex("by_cycle_time", (q) => q.eq("cycleId", latestHistory.cycleId))
					.collect(),
			]);

		const needsEnvelope = envelopes.find((envelope) => envelope.type === "needs");
		const wantsEnvelope = envelopes.find((envelope) => envelope.type === "wants");
		const savingsEnvelope = envelopes.find((envelope) => envelope.type === "savings");
		const extraordinaryAvailableCents = computeAvailableExtraordinarySavingsForMove({
			incomeEvents: incomeEvents.map((event) => ({
				incomeKind: event.incomeKind,
				distributionApplied: { savings: event.distributionApplied.savings },
			})),
			surplusContributions: surplusContributions.map((row) => ({
				fromEnvelope: row.fromEnvelope,
				amount: row.amount,
			})),
			savingsEnvelopeRemainingCents: Math.max(0, savingsEnvelope?.remainingAmount ?? 0),
		});
		const surplusCore = resolveSurplusMove({
			needsRemainingCents: Math.max(0, needsEnvelope?.remainingAmount ?? 0),
			wantsRemainingCents: Math.max(0, wantsEnvelope?.remainingAmount ?? 0),
			extraordinaryAvailableCents,
		});
		const fund = subEnvelopes.find((row) => row.isSystemDefault);
		const moveSurplus =
			surplusCore === null
				? null
				: fund === undefined
					? { fromEnvelope: surplusCore.fromEnvelope, amount: surplusCore.amount }
					: {
							fromEnvelope: surplusCore.fromEnvelope,
							amount: surplusCore.amount,
							toSubEnvelopeId: fund._id,
						};

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
			expenseCount: cycleExpenses.length,
		});

		return {
			justClosed,
			report: {
				closedCycleId: latestHistory.cycleId,
				...report,
				moveSurplus,
			},
		};
	},
});
