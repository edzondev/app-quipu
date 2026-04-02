import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * One-time migration: removes the `monthlyIncome` field from every profile
 * document. Run after deploying the schema change that makes the field optional.
 *
 * Usage:
 *   npx convex run migrations:removeMonthlyIncome
 */
export const removeMonthlyIncome = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await ctx.db.patch(profile._id, { monthlyIncome: undefined });
    }
    return null;
  },
});
