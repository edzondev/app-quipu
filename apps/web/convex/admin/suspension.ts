import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";

const accountStatusValidator = v.union(
	v.literal("active"),
	v.literal("suspended"),
	v.literal("under_review"),
);

/** I5 — solo CLI / dashboard Convex (internal). */
export const setAccountStatus = internalMutation({
	args: {
		profileId: v.id("profiles"),
		accountStatus: accountStatusValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const profile = await ctx.db.get("profiles", args.profileId);
		if (!profile) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Perfil no encontrado.",
			});
		}

		await ctx.db.patch(args.profileId, {
			accountStatus: args.accountStatus,
		});
		return null;
	},
});

export const dismissReviewFlag = internalMutation({
	args: {
		flagId: v.id("accountReviewFlags"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const flag = await ctx.db.get("accountReviewFlags", args.flagId);
		if (!flag) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Flag no encontrada.",
			});
		}
		await ctx.db.patch(args.flagId, { status: "dismissed" });
		return null;
	},
});

export const actionReviewFlag = internalMutation({
	args: {
		flagId: v.id("accountReviewFlags"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const flag = await ctx.db.get("accountReviewFlags", args.flagId);
		if (!flag) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Flag no encontrada.",
			});
		}
		await ctx.db.patch(args.flagId, { status: "actioned" });
		return null;
	},
});
