import { v } from "convex/values";
import { limaStartOfDay } from "../shared/lib/date";
import { mutation } from "./_generated/server";
import { requireActiveAccount } from "./lib/entitlements";
import { evaluateCommitmentCoverageForCycle } from "./lib/evaluateCommitmentCoverage";
import {
	assertFirstCycleAvailable,
	assertOpeningBalanceCents,
	openingEnvelopes,
} from "./lib/firstCycle";
import { assertNextPayDate } from "./lib/firstCycleDates";

/**
 * Primer ciclo de onboarding: el dinero que la persona tiene hoy, hasta su
 * próximo cobro. No crea un incomeEvent.
 */
export const startFirstCycle = mutation({
	args: {
		openingBalanceCents: v.number(),
		nextPayDate: v.string(),
	},
	returns: v.object({ cycleId: v.id("financialCycles") }),
	handler: async (ctx, args) => {
		const profile = await requireActiveAccount(ctx);
		assertOpeningBalanceCents(args.openingBalanceCents);
		const now = Date.now();
		const endDate = assertNextPayDate(args.nextPayDate, now);

		const existingCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id))
			.first();
		assertFirstCycleAvailable(existingCycle !== null);

		const cycleId = await ctx.db.insert("financialCycles", {
			profileId: profile._id,
			startDate: limaStartOfDay(now),
			endDate,
			status: "active",
			totalIncomeReceived: 0,
			isOpeningCycle: true,
		});

		const envelopes = openingEnvelopes({
			openingBalanceCents: args.openingBalanceCents,
			allocationNeeds: profile.allocationNeeds,
			allocationWants: profile.allocationWants,
			allocationSavings: profile.allocationSavings,
		});
		await Promise.all(
			envelopes.map((envelope) =>
				ctx.db.insert("envelopes", {
					profileId: profile._id,
					cycleId,
					type: envelope.type,
					allocatedAmount: envelope.allocatedAmount,
					remainingAmount: envelope.remainingAmount,
					carriedOverCents: envelope.carriedOverCents,
				}),
			),
		);

		await evaluateCommitmentCoverageForCycle(ctx, profile._id, cycleId, now);

		return { cycleId };
	},
});
