import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  distributeSavingsToSubEnvelopes,
  getProfile,
  getProfileOrThrow,
  requirePremium,
} from "./helpers";

// Free plan limit: 1 active savings goal
const FREE_PLAN_GOALS_LIMIT = 1;

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the three savings sub-envelopes: emergency, short_term, investment.
 * These are seeded on profile creation and are always present.
 */
export const getSavingsSubEnvelopes = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    return await ctx.db
      .query("savingsSubEnvelopes")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

/**
 * Returns savings goals.
 * Free plan: limited to 1. Premium: unlimited.
 */
export const getSavingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    return await ctx.db
      .query("savingsGoals")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Internal mutation — distributes a savings amount into sub-envelopes.
 * Not exposed publicly; called internally when needed via ctx.runMutation().
 * Use the `distributeSavingsToSubEnvelopes` helper from helpers.ts instead
 * when the profileId is already available in the same mutation context.
 */
export const distributeSavings = internalMutation({
  args: {
    profileId: v.id("profiles"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.amount <= 0) return null;
    await distributeSavingsToSubEnvelopes(ctx, args.profileId, args.amount);
    return null;
  },
});

/**
 * Withdraws from the emergency fund. Requires explicit `confirm: true`
 * to enforce the deliberate friction described in the product spec.
 */
export const withdrawFromEmergencyFund = mutation({
  args: {
    amount: v.number(),
    confirm: v.boolean(), // must be true, adds friction
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new ConvexError(
        "You must confirm the withdrawal from your emergency fund",
      );
    }

    if (args.amount <= 0) {
      throw new ConvexError("Amount must be greater than 0");
    }

    const profile = await getProfileOrThrow(ctx);

    const sub = await ctx.db
      .query("savingsSubEnvelopes")
      .withIndex("by_profileId_subEnvelopeId", (q) =>
        q.eq("profileId", profile._id).eq("subEnvelopeId", "emergency"),
      )
      .unique();

    if (!sub) throw new ConvexError("Emergency fund not found");
    if (args.amount > sub.currentAmount) {
      throw new ConvexError("Insufficient balance in emergency fund");
    }

    const newAmount = sub.currentAmount - args.amount;
    const goal = sub.goalAmount > 0 ? sub.goalAmount : 1;
    await ctx.db.patch(sub._id, {
      currentAmount: newAmount,
      progress: Math.min(100, Math.round((newAmount / goal) * 100)),
    });

    return null;
  },
});

export const createSavingsGoal = mutation({
  args: {
    name: v.string(),
    emoji: v.string(),
    targetAmount: v.number(),
    deadline: v.string(), // "YYYY-MM-DD"
    monthlyRequired: v.number(),
  },
  returns: v.id("savingsGoals"),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    // Free plan: max 1 active goal
    if (profile.plan === "free") {
      const existing = await ctx.db
        .query("savingsGoals")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect();

      if (existing.length >= FREE_PLAN_GOALS_LIMIT) {
        throw new ConvexError(
          "Free plan limit: 1 savings goal. Upgrade to premium for unlimited goals.",
        );
      }
    }

    return await ctx.db.insert("savingsGoals", {
      profileId: profile._id,
      name: args.name,
      emoji: args.emoji,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      deadline: args.deadline,
      monthlyRequired: args.monthlyRequired,
    });
  },
});

export const updateSavingsGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    deadline: v.optional(v.string()),
    monthlyRequired: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.profileId !== profile._id) {
      throw new ConvexError("Savings goal not found");
    }

    const { goalId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(args.goalId, patch);
    return null;
  },
});

export const deleteSavingsGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.profileId !== profile._id) {
      throw new ConvexError("Savings goal not found");
    }

    await ctx.db.delete(args.goalId);
    return null;
  },
});
