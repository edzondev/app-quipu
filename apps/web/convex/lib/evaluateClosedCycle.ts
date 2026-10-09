import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { evaluateCycleCompliance } from "./budgetMath";
import { computeNextStreak } from "./gamificationMath";
import { loadCycleCoverageById } from "./loadCycleCoverageContext";

/** La racha ignora el ciclo de apertura. El historial de Progreso no. */
export function openingCycleSkipsProgress(isOpeningCycle: boolean | undefined): boolean {
	return isOpeningCycle === true;
}

export function recordsClosedCycleInHistory(isOpeningCycle: boolean | undefined): boolean {
	return openingCycleSkipsProgress(isOpeningCycle) === false || isOpeningCycle === true;
}

export function wantsWithinBudgetOnClose(
	wants: { remainingAmount: number; carriedOverCents?: number } | undefined,
	isOpeningCycle: boolean | undefined,
): boolean {
	const carry = isOpeningCycle === true ? 0 : (wants?.carriedOverCents ?? 0);
	return (wants?.remainingAmount ?? 0) - carry >= 0;
}

export function streakAfterClose(input: {
	isOpeningCycle: boolean | undefined;
	currentStreak: number;
	longestStreak: number;
	compliance: Parameters<typeof computeNextStreak>[2];
}): { currentStreak: number; longestStreak: number } | null {
	if (openingCycleSkipsProgress(input.isOpeningCycle)) return null;
	return computeNextStreak(input.currentStreak, input.longestStreak, input.compliance);
}

export async function evaluateClosedCycle(
	ctx: MutationCtx,
	profileId: Id<"profiles">,
	cycleId: Id<"financialCycles">,
	now: number,
) {
	const cycle = await ctx.db.get("financialCycles", cycleId);
	if (!cycle || !recordsClosedCycleInHistory(cycle.isOpeningCycle)) return;

	const profile = await ctx.db.get("profiles", profileId);
	const closedAtPremium = profile?.plan === "premium";

	const existingHistory = await ctx.db
		.query("cycleHistory")
		.withIndex("by_profile_cycle", (q) => q.eq("profileId", profileId).eq("cycleId", cycleId))
		.unique();
	if (existingHistory) return;

	const streakRow = await ctx.db
		.query("streaks")
		.withIndex("by_profileId", (q) => q.eq("profileId", profileId))
		.unique();

	if (streakRow?.lastEvaluatedCycleId === cycleId) return;

	const envelopes = await ctx.db
		.query("envelopes")
		.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId))
		.collect();

	const compliance = evaluateCycleCompliance(envelopes, cycle.isOpeningCycle === true);
	const wantsEnvelope = envelopes.find((env) => env.type === "wants");
	const wantsWithinBudget = wantsWithinBudgetOnClose(wantsEnvelope, cycle.isOpeningCycle);

	const coverageContext = await loadCycleCoverageById(ctx, profileId, cycleId, now);
	const commitments = coverageContext?.commitments ?? [];
	const coverageById = coverageContext?.coverageById ?? new Map();

	const allCommitmentsCovered =
		commitments.length === 0
			? true
			: commitments.every((commitment) => coverageById.get(commitment._id)?.status === "covered");

	await ctx.db.insert("cycleHistory", {
		profileId,
		cycleId,
		status: compliance,
		evaluatedAt: now,
		wantsWithinBudget,
		allCommitmentsCovered,
		closedAtPremium,
	});

	const currentStreak = streakRow?.currentStreak ?? 0;
	const longestStreak = streakRow?.longestStreak ?? 0;
	const next = streakAfterClose({
		isOpeningCycle: cycle.isOpeningCycle,
		currentStreak,
		longestStreak,
		compliance,
	});
	if (next === null) return;

	if (streakRow) {
		await ctx.db.patch(streakRow._id, {
			currentStreak: next.currentStreak,
			longestStreak: next.longestStreak,
			lastEvaluatedCycleId: cycleId,
		});
	} else {
		await ctx.db.insert("streaks", {
			profileId,
			currentStreak: next.currentStreak,
			longestStreak: next.longestStreak,
			lastEvaluatedCycleId: cycleId,
		});
	}
}
