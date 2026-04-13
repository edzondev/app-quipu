import { v } from "convex/values";
import { query } from "./_generated/server";
import { currentMonthString, computeEnvelopes } from "./helpers";

const envelopeItem = v.object({
  key: v.union(v.literal("needs"), v.literal("wants"), v.literal("juntos")),
  label: v.string(),
  emoji: v.string(),
  allocated: v.number(),
  spent: v.number(),
  available: v.number(),
});

/**
 * Returns the selectable expense envelopes for the current user with their
 * current balances. Intentionally lightweight — only computes what's needed
 * to render an envelope picker (e.g. quick-expense selector, transfer form).
 *
 * - `needs` and `wants` are always included.
 * - `juntos` is included only when couple mode is active.
 * - Savings is excluded: expenses cannot be charged to savings per the schema.
 */
export const getEnvelopes = query({
  args: {
    month: v.optional(v.string()), // "YYYY-MM" — pass from client for deterministic caching
  },
  returns: v.union(v.array(envelopeItem), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const month = args.month ?? currentMonthString();
    const { envelopes } = await computeEnvelopes(ctx, profile, month);

    const result: Array<{
      key: "needs" | "wants" | "juntos";
      label: string;
      emoji: string;
      allocated: number;
      spent: number;
      available: number;
    }> = [
      {
        key: "needs",
        label: "Necesidades",
        emoji: "🏠",
        allocated: envelopes.needs.allocated,
        spent: envelopes.needs.spent,
        available: envelopes.needs.available,
      },
      {
        key: "wants",
        label: "Gustos",
        emoji: "✨",
        allocated: envelopes.wants.allocated,
        spent: envelopes.wants.spent,
        available: envelopes.wants.available,
      },
    ];

    if (envelopes.juntos) {
      result.push({
        key: "juntos",
        label: "Juntos",
        emoji: "💑",
        allocated: envelopes.juntos.budget,
        spent: envelopes.juntos.spent,
        available: envelopes.juntos.available,
      });
    }

    return result;
  },
});
