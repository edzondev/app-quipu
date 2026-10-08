import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { shouldTransitionSpaceToReadonly } from "./spaceAuthLogic";

/** Account delete: leave spaces, close owned ones, revoke pending invites. */
export async function detachProfileFromSpacesOnDelete(
	ctx: MutationCtx,
	profileId: Id<"profiles">,
): Promise<void> {
	const now = Date.now();

	const memberships = await ctx.db
		.query("spaceMembers")
		.withIndex("by_profile", (q) => q.eq("profileId", profileId))
		.collect();

	const leavePromises: Array<Promise<void>> = [];
	for (const membership of memberships) {
		if (membership.status === "active") {
			leavePromises.push(
				ctx.db.patch(membership._id, {
					status: "left",
					leftAt: now,
				}),
			);
		}
	}
	await Promise.all(leavePromises);

	const ownedSpaces = await ctx.db
		.query("financialSpaces")
		.withIndex("by_creator", (q) => q.eq("createdByProfileId", profileId))
		.collect();

	await Promise.all(
		ownedSpaces.map(async (space) => {
			if (space.status === "active" || space.status === "readonly") {
				await ctx.db.patch(space._id, {
					status: "closed",
					closedAt: now,
				});
			}

			const pendingInvites = await ctx.db
				.query("spaceInvitations")
				.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "pending"))
				.collect();
			await Promise.all(
				pendingInvites.map((invitation) => ctx.db.patch(invitation._id, { status: "revoked" })),
			);
		}),
	);
}

export async function transitionOwnedSpacesOnPlanChange(
	ctx: MutationCtx,
	profile: Doc<"profiles">,
): Promise<void> {
	const spaces = await ctx.db
		.query("financialSpaces")
		.withIndex("by_creator", (q) => q.eq("createdByProfileId", profile._id))
		.collect();

	const readonlyPromises: Array<Promise<void>> = [];
	for (const space of spaces) {
		if (shouldTransitionSpaceToReadonly(space, profile)) {
			readonlyPromises.push(
				ctx.db.patch(space._id, {
					status: "readonly",
					premiumExpiredAt: Date.now(),
				}),
			);
		}
	}
	await Promise.all(readonlyPromises);
}
