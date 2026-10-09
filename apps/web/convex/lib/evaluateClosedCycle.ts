import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { evaluateCycleCompliance } from "./budgetMath";
import { computeNextStreak } from "./gamificationMath";
import { loadCycleCoverageById } from "./loadCycleCoverageContext";

export async function evaluateClosedCycle(
	ctx: MutationCtx,
	profileId: Id<"profiles">,
	cycleId: Id<"financialCycles">,
	now: number,
) {
	const cycle = await ctx.db.get("financialCycles", cycleId);
	if (!cycle) return;

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

	const compliance = evaluateCycleCompliance(envelopes);
	const wantsEnvelope = envelopes.find((env) => env.type === "wants");
	const wantsWithinBudget =
		(wantsEnvelope?.remainingAmount ?? 0) - (wantsEnvelope?.carriedOverCents ?? 0) >= 0;

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
	const next = computeNextStreak(currentStreak, longestStreak, compliance);

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
