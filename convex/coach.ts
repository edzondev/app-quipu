import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getProfile, getProfileOrThrow, todayString } from "./helpers";
import type { Id } from "./_generated/dataModel";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns unread coach messages for the current user.
 * Free plan: limited to 1 tip per week (enforced on creation, not here).
 */
const coachMessageValidator = v.object({
  _id: v.id("coachMessages"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  type: v.union(
    v.literal("alert"),
    v.literal("celebration"),
    v.literal("encouragement"),
    v.literal("warning"),
  ),
  message: v.string(),
  date: v.string(),
  read: v.boolean(),
});

export const getUnreadCoachMessages = query({
  args: {},
  returns: v.union(v.null(), v.array(coachMessageValidator)),
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    return await ctx.db
      .query("coachMessages")
      .withIndex("by_profileId_read", (q) =>
        q.eq("profileId", profile._id).eq("read", false),
      )
      .order("desc")
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const markCoachMessageRead = mutation({
  args: { messageId: v.id("coachMessages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message || message.profileId !== profile._id) return null;

    await ctx.db.patch(args.messageId, { read: true });
    return null;
  },
});

// ─── Internal Mutations ────────────────────────────────────────────────────────

/**
 * Creates a coach message for a given profile.
 * Called internally from payday processing or scheduled functions.
 *
 * Free plan: enforces 1 message per week.
 * Premium: no limit.
 */
export const createCoachMessage = internalMutation({
  args: {
    profileId: v.id("profiles"),
    type: v.union(
      v.literal("alert"),
      v.literal("celebration"),
      v.literal("encouragement"),
      v.literal("warning"),
    ),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    // Free plan: max 1 tip per week — check last 7 days using date index
    if (profile.plan === "free") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const recentMessage = await ctx.db
        .query("coachMessages")
        .withIndex("by_profileId_date", (q) =>
          q
            .eq("profileId", args.profileId)
            .gte("date", sevenDaysAgo),
        )
        .first();

      if (recentMessage) return null;
    }

    await ctx.db.insert("coachMessages", {
      profileId: args.profileId,
      type: args.type,
      message: args.message,
      date: todayString(),
      read: false,
    });

    return null;
  },
});
