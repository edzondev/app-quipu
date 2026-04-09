import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { getProfileOrThrow } from "./helpers";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getMyPlan = query({
  args: {},
  returns: v.object({
    plan: v.union(v.literal("free"), v.literal("premium")),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    planActivatedAt: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);
    return {
      plan: profile.plan,
      polarSubscriptionId: profile.polarSubscriptionId,
      polarCustomerId: profile.polarCustomerId,
      planActivatedAt: profile.planActivatedAt,
    };
  },
});

// ─── Internal Queries ─────────────────────────────────────────────────────────

/**
 * Same as getMyPlan but internal — used by polar.ts actions that need
 * polarCustomerId without going through the public API surface.
 */
export const getMyPlanInternal = internalQuery({
  args: {},
  returns: v.object({
    plan: v.union(v.literal("free"), v.literal("premium")),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    planActivatedAt: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);
    return {
      plan: profile.plan,
      polarSubscriptionId: profile.polarSubscriptionId,
      polarCustomerId: profile.polarCustomerId,
      planActivatedAt: profile.planActivatedAt,
    };
  },
});

// ─── Internal Mutations (called from Polar webhooks via HTTP action) ───────────

/**
 * Activates premium plan after a successful Polar subscription.
 * Looked up by polarCustomerId since that's what Polar sends in webhooks.
 */
export const activatePremium = internalMutation({
  args: {
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find profile by polarCustomerId using index for O(log n) lookup
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId),
      )
      .unique();

    if (!profile) {
      // First time: the polarCustomerId might not be set yet.
      // This is handled by the webhook also sending the userId.
      return null;
    }

    await ctx.db.patch(profile._id, {
      plan: "premium",
      polarSubscriptionId: args.polarSubscriptionId,
      planActivatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Called when Polar sends subscription.revoked.
 * Downgrades the user back to the free plan.
 */
export const revokePremium = internalMutation({
  args: {
    polarSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find profile by polarSubscriptionId using index for O(log n) lookup
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId),
      )
      .unique();

    if (!profile) return null;

    await ctx.db.patch(profile._id, {
      plan: "free",
    });

    return null;
  },
});

/**
 * Links a Polar customer ID to a profile. Called on the first webhook
 * (subscription.created) using the userId embedded in the Polar metadata.
 */
export const linkPolarCustomer = internalMutation({
  args: {
    userId: v.string(), // Better Auth user._id
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return null;

    await ctx.db.patch(profile._id, {
      plan: "premium",
      polarCustomerId: args.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId,
      planActivatedAt: Date.now(),
    });

    return null;
  },
});
