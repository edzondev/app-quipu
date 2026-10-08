import { v } from "convex/values";
import { query } from "./_generated/server";
import { buildCycleForecast, type EnvelopeType } from "./lib/cycleForecast";
import { computeCycleDayMetrics } from "./lib/dashboardMath";
import { requirePremiumProfile } from "./lib/entitlements";

const envelopeForecastValidator = v.object({
	type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
	label: v.string(),
	burnRateCentsPerDay: v.union(v.number(), v.null()),
	daysUntilDepleted: v.union(v.number(), v.null()),
	closeProjectionCents: v.union(v.number(), v.null()),
	depletedCalendarDay: v.union(v.number(), v.null()),
});

const cycleForecastValidator = v.union(
	v.null(),
	v.object({
		envelopes: v.array(envelopeForecastValidator),
		earliestDepletion: v.union(
			v.null(),
			v.object({
				envelopeType: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
				envelopeLabel: v.string(),
				calendarDay: v.union(v.number(), v.null()),
				daysUntilDepleted: v.union(v.number(), v.null()),
			}),
		),
	}),
);

export const getCycleForecast = query({
	args: {},
	returns: cycleForecastValidator,
	handler: async (ctx) => {
		const profile = await requirePremiumProfile(ctx);
		const now = Date.now();

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activeCycle) {
			return null;
		}

		const [envelopes, expenses] = await Promise.all([
			ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
				.collect(),
			ctx.db
				.query("expenses")
				.withIndex("by_cycle_envelope_time", (q) => q.eq("cycleId", activeCycle._id))
				.collect(),
		]);

		const cycleMetrics = computeCycleDayMetrics(activeCycle.startDate, activeCycle.endDate, now);

		const spentByType = expenses.reduce(
			(acc, expense) => {
				const envelope = envelopes.find((item) => item._id === expense.envelopeId);
				if (!envelope) return acc;
				acc[envelope.type] += expense.amount;
				return acc;
			},
			{ needs: 0, wants: 0, savings: 0 } as Record<EnvelopeType, number>,
		);

		return buildCycleForecast({
			cycleDay: cycleMetrics.daysElapsed,
			daysRemaining: cycleMetrics.daysRemaining,
			now,
			envelopes: (["needs", "wants", "savings"] as const).map((type) => {
				const envelope = envelopes.find((item) => item.type === type);
				return {
					type,
					remainingAmount: envelope?.remainingAmount ?? 0,
					spentAmount: spentByType[type],
				};
			}),
		});
	},
});
