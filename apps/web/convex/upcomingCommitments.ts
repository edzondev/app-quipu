import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { daysUntilNextDue } from "./lib/commitmentCoverage";
import { resolveCommitmentNextDueAt } from "./lib/commitmentDueDate";
import { requirePremiumProfile } from "./lib/entitlements";
import { loadCycleCoverageById } from "./lib/loadCycleCoverageContext";
import { buildUpcomingBadgeLabel, filterUpcomingCommitments } from "./lib/upcomingCommitments";

const upcomingCommitmentValidator = v.object({
	id: v.id("fixedCommitments"),
	name: v.string(),
	amount: v.number(),
	remaining: v.number(),
	dueDay: v.number(),
	daysUntilDue: v.number(),
	cascadeStatus: v.union(
		v.literal("covered"),
		v.literal("partial"),
		v.literal("not-started"),
		v.literal("overdue"),
	),
});

export const listUpcomingForBadge = query({
	args: {},
	returns: v.object({
		badgeLabel: v.union(v.string(), v.null()),
		items: v.array(upcomingCommitmentValidator),
	}),
	handler: async (ctx) => {
		const profile = await requirePremiumProfile(ctx);
		const now = Date.now();

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();

		if (!activeCycle) {
			return { badgeLabel: null, items: [] };
		}

		const coverageContext = await loadCycleCoverageById(ctx, profile._id, activeCycle._id, now);
		if (!coverageContext) {
			return { badgeLabel: null, items: [] };
		}

		const { commitments: commitmentsRaw, coverageById } = coverageContext;

		const slices = commitmentsRaw.map((commitment) => {
			const nextDueAt = resolveCommitmentNextDueAt({
				dueDay: commitment.dueDay,
				nextDueAt: commitment.nextDueAt,
				createdAt: commitment._creationTime,
			});
			const coverage = coverageById.get(commitment._id);

			return {
				id: commitment._id,
				name: commitment.name,
				amount: commitment.amount,
				remaining: coverage?.remaining ?? commitment.amount,
				dueDay: commitment.dueDay,
				nextDueAt,
				daysUntilDue: daysUntilNextDue(nextDueAt, now),
				cascadeStatus: coverage?.status ?? ("not-started" as const),
			};
		});

		const allUpcoming = filterUpcomingCommitments(slices, now);
		const upcoming = allUpcoming.slice(0, 3);

		return {
			badgeLabel: buildUpcomingBadgeLabel(allUpcoming.length),
			items: upcoming.map((item) => ({
				id: item.id as Id<"fixedCommitments">,
				name: item.name,
				amount: item.amount,
				remaining: item.remaining,
				dueDay: item.dueDay,
				daysUntilDue: item.daysUntilDue,
				cascadeStatus: item.cascadeStatus,
			})),
		};
	},
});
