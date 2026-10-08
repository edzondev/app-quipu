import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSpaceMember, requireSpaceWritable } from "./lib/spaceAuth";

export const list = query({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.array(
		v.object({
			_id: v.id("spaceGoals"),
			label: v.string(),
			emoji: v.string(),
			currentAmount: v.number(),
			targetAmount: v.optional(v.number()),
		}),
	),
	handler: async (ctx, args) => {
		await requireSpaceMember(ctx, args.spaceId);
		return await ctx.db
			.query("spaceGoals")
			.withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
			.collect();
	},
});

export const create = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		label: v.string(),
		emoji: v.string(),
		targetAmount: v.optional(v.number()),
	},
	returns: v.id("spaceGoals"),
	handler: async (ctx, args) => {
		await requireSpaceMember(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);

		const label = args.label.trim();
		if (!label) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "La meta necesita un nombre.",
			});
		}

		return await ctx.db.insert("spaceGoals", {
			spaceId: args.spaceId,
			label,
			emoji: args.emoji.trim() || "🎯",
			currentAmount: 0,
			targetAmount: args.targetAmount,
			createdAt: Date.now(),
		});
	},
});

export const contribute = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		goalId: v.id("spaceGoals"),
		amountCents: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireSpaceMember(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);

		if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El monto debe ser positivo.",
			});
		}

		const goal = await ctx.db.get("spaceGoals", args.goalId);
		if (!goal || goal.spaceId !== args.spaceId) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Meta no encontrada.",
			});
		}

		await ctx.db.patch(goal._id, {
			currentAmount: goal.currentAmount + args.amountCents,
		});
		return null;
	},
});
