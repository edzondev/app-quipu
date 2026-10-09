import { type Infer, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { computeAvailableExtraordinarySavingsForMove } from "./extraordinarySavingsSurplus";

const dashboardClosedCycleValidator = v.union(
	v.null(),
	v.object({
		startDate: v.number(),
		endDate: v.number(),
		surplusCents: v.number(),
		surplusDestination: v.literal("emergency_fund"),
		surplusMovedAt: v.union(v.number(), v.null()),
	}),
);

export type DashboardClosedCycle = Infer<typeof dashboardClosedCycleValidator>;

export type LatestClosedCycleSlice = Pick<
	Doc<"financialCycles">,
	"startDate" | "endDate" | "closeSurplusMovedAt"
>;

export async function findLatestClosedCycle(
	ctx: QueryCtx | MutationCtx,
	profileId: Id<"profiles">,
) {
	return await ctx.db
		.query("financialCycles")
		.withIndex("by_profile_status", (q) => q.eq("profileId", profileId).eq("status", "closed"))
		.order("desc")
		.first();
}

export async function loadClosedCycleSurplusAmounts(
	ctx: QueryCtx | MutationCtx,
	cycleId: Id<"financialCycles">,
) {
	const [needsEnvelope, wantsEnvelope, savingsEnvelope, incomeEvents, surplusContributions] =
		await Promise.all([
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "needs"))
				.unique(),
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "wants"))
				.unique(),
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "savings"))
				.unique(),
			ctx.db
				.query("incomeEvents")
				.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
				.collect(),
			ctx.db
				.query("surplusContributions")
				.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
				.collect(),
		]);

	const needs = Math.max(0, needsEnvelope?.remainingAmount ?? 0);
	const wants = Math.max(0, wantsEnvelope?.remainingAmount ?? 0);
	const extraordinary = computeAvailableExtraordinarySavingsForMove({
		incomeEvents: incomeEvents.map((event) => ({
			incomeKind: event.incomeKind,
			distributionApplied: event.distributionApplied,
		})),
		surplusContributions: surplusContributions.map((row) => ({
			fromEnvelope: row.fromEnvelope,
			amount: row.amount,
		})),
		savingsEnvelopeRemainingCents: Math.max(0, savingsEnvelope?.remainingAmount ?? 0),
	});

	return { needs, wants, extraordinary, total: needs + wants + extraordinary };
}

/** Presenta el último ciclo cerrado para el dashboard. Null si nunca hubo uno. */
export function dashboardClosedCycle(
	latestClosed: LatestClosedCycleSlice | null,
	surplusCents: number,
): DashboardClosedCycle {
	if (latestClosed === null) return null;
	return {
		startDate: latestClosed.startDate,
		endDate: latestClosed.endDate,
		surplusCents,
		surplusDestination: "emergency_fund",
		surplusMovedAt: latestClosed.closeSurplusMovedAt ?? null,
	};
}
