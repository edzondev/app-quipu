import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getActiveSpaceCycle, requireSpaceOwner, requireSpaceWritable } from "./lib/spaceAuth";
import { computeMemberParticipationCents } from "./lib/spaceParticipation";

export const closeActive = mutation({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireSpaceOwner(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);

		const cycle = await getActiveSpaceCycle(ctx, args.spaceId);
		if (!cycle) {
			throw new ConvexError({
				code: "NO_ACTIVE_CYCLE",
				message: "No hay ciclo activo.",
			});
		}

		const space = await ctx.db.get("financialSpaces", args.spaceId);
		if (!space) return null;

		const [members, contributions] = await Promise.all([
			ctx.db
				.query("spaceMembers")
				.withIndex("by_space_status", (q) => q.eq("spaceId", args.spaceId).eq("status", "active"))
				.collect(),
			ctx.db
				.query("spaceContributions")
				.withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
				.collect(),
		]);

		const memberParticipationSnapshot = Object.fromEntries(
			members.map((member) => [
				member.profileId,
				{
					expectedContributionCents: member.expectedContributionCents,
					contributedCents: computeMemberParticipationCents(
						contributions.filter((row) => row.fromProfileId === member.profileId),
					),
				},
			]),
		);

		const envelopes = await ctx.db
			.query("spaceEnvelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycle._id))
			.collect();

		await ctx.db.patch(cycle._id, {
			status: "closed",
			closedAt: Date.now(),
			memberParticipationSnapshot,
			allocationSnapshot: {
				allocationNeeds: space.allocationNeeds,
				allocationWants: space.allocationWants,
				allocationSavings: space.allocationSavings,
				envelopes: envelopes.map((envelope) => ({
					type: envelope.type,
					allocatedAmount: envelope.allocatedAmount,
					remainingAmount: envelope.remainingAmount,
				})),
			},
		});

		const now = Date.now();
		const endDate = now + space.cycleDurationDays * 24 * 60 * 60 * 1000;
		const nextCycleId = await ctx.db.insert("spaceCycles", {
			spaceId: args.spaceId,
			startDate: now,
			endDate,
			status: "active",
			totalContributionsReceived: 0,
			unallocatedCents: 0,
		});

		await Promise.all(
			(["needs", "wants", "savings"] as const).map((type) =>
				ctx.db.insert("spaceEnvelopes", {
					spaceId: args.spaceId,
					cycleId: nextCycleId,
					type,
					allocatedAmount: 0,
					remainingAmount: 0,
				}),
			),
		);

		return null;
	},
});
