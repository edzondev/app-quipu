import { internalQuery } from "./_generated/server";

/**
 * Used by @convex-dev/polar's getUserInfo callback.
 * Returns the current user's Convex userId and email from the auth token.
 * ctx.auth is available here (QueryCtx) but NOT in the polar RunQueryCtx.
 */
export const getCurrentUserInfo = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return {
      userId: identity.subject,
      email: identity.email ?? "",
    };
  },
});
