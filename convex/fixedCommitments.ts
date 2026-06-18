import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfileOrThrow, requirePremium } from "./helpers";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all fixed commitments for the current user.
 * Premium feature: free users can see a preview but cannot create new ones.
 */
export const listFixedCommitments = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);
    return await ctx.db
      .query("fixedCommitments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createFixedCommitment = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    envelope: v.union(v.literal("needs"), v.literal("wants")),
  },
  returns: v.id("fixedCommitments"),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);
    requirePremium(profile.plan);

    if (args.amount <= 0) {
      throw new ConvexError("Amount must be greater than 0");
    }

    return await ctx.db.insert("fixedCommitments", {
      profileId: profile._id,
      name: args.name,
      amount: args.amount,
      envelope: args.envelope,
    });
  },
});

export const updateFixedCommitment = mutation({
  args: {
    commitmentId: v.id("fixedCommitments"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    envelope: v.optional(v.union(v.literal("needs"), v.literal("wants"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);
    requirePremium(profile.plan);

    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment || commitment.profileId !== profile._id) {
      throw new ConvexError("Fixed commitment not found");
    }

    const { commitmentId: _, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(args.commitmentId, patch);
    return null;
  },
});

export const deleteFixedCommitment = mutation({
  args: { commitmentId: v.id("fixedCommitments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);
    requirePremium(profile.plan);

    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment || commitment.profileId !== profile._id) {
      throw new ConvexError("Fixed commitment not found");
    }

    await ctx.db.delete(args.commitmentId);
    return null;
  },
});
