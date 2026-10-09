import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { shouldCloseExpiredCycle } from "./lib/cycleExpiry";
import { requireActiveAccount } from "./lib/entitlements";
import { evaluateClosedCycle } from "./lib/evaluateClosedCycle";

/**
 * Closes the active cycle once its Lima pay date has arrived.
 * Does not insert the next cycle.
 */
export const closeExpired = mutation({
	args: {},
	returns: v.object({ closed: v.boolean() }),
	handler: async (ctx) => {
		const profile = await requireActiveAccount(ctx);
		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		const now = Date.now();
		if (activeCycle === null || shouldCloseExpiredCycle(activeCycle, now) !== "close") {
			return { closed: false };
		}

		await evaluateClosedCycle(ctx, profile._id, activeCycle._id, now);
		await ctx.db.patch(activeCycle._id, { status: "closed" });
		return { closed: true };
	},
});
