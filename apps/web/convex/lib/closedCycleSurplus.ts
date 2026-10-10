import { type Infer, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { computeCycleCarryover, signedCycleSurplusCents } from "./cycleCarryover";
import { computeAvailableExtraordinarySavingsForMove } from "./extraordinarySavingsSurplus";

const dashboardClosedCycleValidator = v.union(
	v.null(),
	v.object({
		cycleId: v.id("financialCycles"),
		startDate: v.number(),
		endDate: v.number(),
		surplusCents: v.number(),
		surplusMovedAt: v.union(v.number(), v.null()),
	}),
);

export type DashboardClosedCycle = Infer<typeof dashboardClosedCycleValidator>;

export type LatestClosedCycleSlice = Pick<
	Doc<"financialCycles">,
	"_id" | "startDate" | "endDate" | "closeSurplusMovedAt"
>;

type ClosedCycleSource<TId extends string> = {
	_id: TId;
	startDate: number;
	endDate: number;
	closeSurplusMovedAt?: number;
};

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

/** Money that can move to the Fund. A negative envelope cannot. */
export function movableEnvelopeCents(remainingAmount: number | undefined): number {
	return Math.max(0, remainingAmount ?? 0);
}

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
	carriedOverToCycleId?: string,
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

	const needs = movableEnvelopeCents(needsEnvelope?.remainingAmount);
	const wants = movableEnvelopeCents(wantsEnvelope?.remainingAmount);
	const extraordinary = computeAvailableExtraordinarySavingsForMove({
		incomeEvents: incomeEvents.map((event) => ({
			incomeKind: event.incomeKind,
			distributionApplied: event.distributionApplied,
		})),
		surplusContributions: surplusContributions.map((row) => ({
			fromEnvelope: row.fromEnvelope,
			amount: row.amount,
		})),
		savingsEnvelopeRemainingCents: movableEnvelopeCents(savingsEnvelope?.remainingAmount),
	});
	const breakdown = closedCycleSurplusBreakdown({
		closeSurplusMovedAt,
		needs,
		wants,
		extraordinary,
		surplusContributions,
	});
	const envelopes = [needsEnvelope, wantsEnvelope, savingsEnvelope].flatMap((envelope) =>
		envelope ? [envelope] : [],
	);

	return {
		needs: breakdown.needs,
		wants: breakdown.wants,
		extraordinary: breakdown.extraordinary,
		total: breakdown.total,
		signedSurplusCents: signedCycleSurplusCents(
			computeCycleCarryover({
				envelopes,
				closeSurplusMovedAt,
				carriedOverToCycleId,
				surplusContributions,
				incomeEvents,
			}),
		),
	};
}

/** Presenta el último ciclo cerrado para el dashboard. Null si nunca hubo uno. */
export function dashboardClosedCycle<TId extends string>(
	latestClosed: ClosedCycleSource<TId> | null,
	surplusCents: number,
): null | {
	cycleId: TId;
	startDate: number;
	endDate: number;
	surplusCents: number;
	surplusMovedAt: number | null;
} {
	if (latestClosed === null) return null;
	return {
		cycleId: latestClosed._id,
		startDate: latestClosed.startDate,
		endDate: latestClosed.endDate,
		surplusCents,
		surplusMovedAt: latestClosed.closeSurplusMovedAt ?? null,
	};
}

/** Con ciclo activo el resumen siempre lleva closedCycle presente y null. */
export function summaryClosedCycle<TId extends string>(
	hasActiveCycle: boolean,
	latestClosed: ClosedCycleSource<TId> | null,
	surplusCents: number,
) {
	if (hasActiveCycle) return null;
	return dashboardClosedCycle(latestClosed, surplusCents);
}
