import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSpaceMember, requireSpaceWritable } from "./lib/spaceAuth";

export const list = query({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.array(
		v.object({
			_id: v.id("spaceCommitments"),
			name: v.string(),
			amount: v.number(),
			envelope: v.union(v.literal("needs"), v.literal("wants")),
			dueDay: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		await requireSpaceMember(ctx, args.spaceId);
		return await ctx.db
			.query("spaceCommitments")
			.withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
			.collect();
	},
});

export const create = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		name: v.string(),
		amount: v.number(),
		envelope: v.union(v.literal("needs"), v.literal("wants")),
		dueDay: v.number(),
	},
	returns: v.id("spaceCommitments"),
	handler: async (ctx, args) => {
		await requireSpaceMember(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);

		const name = args.name.trim();
		if (!name) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El nombre es obligatorio.",
			});
		}
		if (!Number.isInteger(args.amount) || args.amount <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El monto debe ser positivo.",
			});
		}
		if (!Number.isInteger(args.dueDay) || args.dueDay < 1 || args.dueDay > 31) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "dueDay debe estar entre 1 y 31.",
			});
		}

		return await ctx.db.insert("spaceCommitments", {
			spaceId: args.spaceId,
			name,
			amount: args.amount,
			envelope: args.envelope,
			dueDay: args.dueDay,
			createdAt: Date.now(),
		});
	},
});
