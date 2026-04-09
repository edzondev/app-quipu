import { ConvexError, v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";
import { getProfileOrThrow } from "./helpers";

/**
 * Used by @convex-dev/polar's getUserInfo callback.
 * Returns the current user's Convex userId and email from the auth token.
 * ctx.auth is available here (QueryCtx) but NOT in the polar RunQueryCtx.
 */
export const getCurrentUserInfo = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    return {
      userId: identity.subject,
      email: identity.email ?? "",
    };
  },
});

/**
 * Permanently deletes the authenticated user's account and all associated data.
 * Cascade-deletes documents from every table that references the profile.
 */
export const deleteAccount = mutation({
  args: {
    confirmEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const profile = await getProfileOrThrow(ctx);

    // Verify the confirmation email matches the session email
    if (!identity.email) {
      throw new ConvexError(
        "No podemos verificar tu correo porque el proveedor no lo provee.",
      );
    }
    if (args.confirmEmail !== identity.email) {
      throw new ConvexError(
        "El email de confirmación no coincide con tu cuenta.",
      );
    }

    const profileId = profile._id;

    // Delete all related data from every table with by_profileId index
    const tables = [
      "expenses",
      "fixedCommitments",
      "specialIncomes",
      "savingsSubEnvelopes",
      "savingsGoals",
      "coachMessages",
      "achievements",
      "streaks",
      "streakMonthlyHistory",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db
        .query(table)
        .withIndex("by_profileId", (q) => q.eq("profileId", profileId))
        .collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    // Delete the profile itself
    await ctx.db.delete(profileId);

    // NOTE: Better Auth user/session/account records live in the Better Auth
    // component's isolated schema and cannot be deleted via ctx.db here.
    // They should be cleaned up by calling the Better Auth admin.deleteUser
    // API from the client-side after this mutation completes, or by configuring
    // Better Auth's `deleteUserFn` callback. Tracked as a known data-hygiene gap.

    return null;
  },
});
