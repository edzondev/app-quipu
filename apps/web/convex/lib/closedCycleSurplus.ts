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

type SurplusContributionSlice = Pick<
	Doc<"surplusContributions">,
	"amount" | "createdAt" | "contributionKind" | "fromEnvelope"
>;

export type ClosedCycleSurplusBreakdown = {
	needs: number;
	wants: number;
	extraordinary: number;
	total: number;
};

function isCloseSurplusMoveRow(
	row: Pick<SurplusContributionSlice, "createdAt" | "contributionKind">,
	movedAt: number,
): boolean {
	return row.contributionKind === "additional" && row.createdAt === movedAt;
}

/**
 * Antes del move: Needs, Wants y extraordinario vivos.
 * Después: las surplusContributions additional con createdAt === closeSurplusMovedAt,
 * agrupadas por fromEnvelope. Esas filas suman el total.
 */
export function closedCycleSurplusBreakdown(input: {
	closeSurplusMovedAt: Doc<"financialCycles">["closeSurplusMovedAt"];
	needs: number;
	wants: number;
	extraordinary: number;
	surplusContributions: ReadonlyArray<SurplusContributionSlice>;
}): ClosedCycleSurplusBreakdown {
	const movedAt = input.closeSurplusMovedAt;
	if (movedAt === undefined) {
		return {
			needs: input.needs,
			wants: input.wants,
			extraordinary: input.extraordinary,
			total: input.needs + input.wants + input.extraordinary,
		};
	}

	const parts: ClosedCycleSurplusBreakdown = {
		needs: 0,
		wants: 0,
		extraordinary: 0,
		total: 0,
	};
	for (const row of input.surplusContributions) {
		if (!isCloseSurplusMoveRow(row, movedAt)) continue;
		parts[row.fromEnvelope] += row.amount;
	}
	parts.total = parts.needs + parts.wants + parts.extraordinary;
	return parts;
}

/** Total del desglose. Misma regla, sin repetir el filtro de las filas. */
export function closedCycleSurplusCents(
	input: Parameters<typeof closedCycleSurplusBreakdown>[0],
): number {
	return closedCycleSurplusBreakdown(input).total;
}

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
	closeSurplusMovedAt: Doc<"financialCycles">["closeSurplusMovedAt"],
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
	const breakdown = closedCycleSurplusBreakdown({
		closeSurplusMovedAt,
		needs,
		wants,
		extraordinary,
		surplusContributions,
	});

	return {
		needs: breakdown.needs,
		wants: breakdown.wants,
		extraordinary: breakdown.extraordinary,
		total: breakdown.total,
		needsEnvelope,
		wantsEnvelope,
		savingsEnvelope,
	};
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

/** Con ciclo activo el resumen siempre lleva closedCycle presente y null. */
export function summaryClosedCycle(
	hasActiveCycle: boolean,
	latestClosed: LatestClosedCycleSlice | null,
	surplusCents: number,
): DashboardClosedCycle {
	if (hasActiveCycle) return null;
	return dashboardClosedCycle(latestClosed, surplusCents);
}
