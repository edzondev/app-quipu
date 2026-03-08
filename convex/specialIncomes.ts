import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfileOrThrow, requirePremium } from "./helpers";

// Threshold: a special income is detected when > 1.5x the configured monthly income
const EXTRAORDINARY_INCOME_MULTIPLIER = 1.5;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listSpecialIncomes = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);
    return await ctx.db
      .query("specialIncomes")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .collect();
  },
});

/**
 * Checks if a given amount qualifies as an extraordinary income
 * (e.g., gratificación, CTS). Returns the breakdown if it does.
 * This is called on the client side to decide whether to show
 * the GratificacionScreen.
 */
export const checkIfExtraordinary = query({
  args: { amount: v.number() },
  returns: v.union(
    v.object({
      isExtraordinary: v.literal(true),
      needs: v.number(),
      wants: v.number(),
      savings: v.number(),
    }),
    v.object({ isExtraordinary: v.literal(false) }),
  ),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);
    const threshold =
      profile.monthlyIncome * EXTRAORDINARY_INCOME_MULTIPLIER;

    if (args.amount <= threshold) {
      return { isExtraordinary: false as const };
    }

    return {
      isExtraordinary: true as const,
      needs: args.amount * (profile.allocationNeeds / 100),
      wants: args.amount * (profile.allocationWants / 100),
      savings: args.amount * (profile.allocationSavings / 100),
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Registers a special income (gratificación, CTS, bonus) and applies
 * the chosen allocation strategy.
 *
 * Premium feature. The amount is ADDED to existing envelope balances,
 * never replacing the current month's allocation.
 */
export const registerSpecialIncome = mutation({
  args: {
    typeId: v.string(), // e.g. "gratificacion_julio", "cts", "bono"
    amount: v.number(),
    month: v.optional(v.number()), // optional month timestamp
    allocationStrategy: v.union(
      v.literal("savings"),
      v.literal("distribute"),
      v.literal("custom"),
    ),
    customAllocNeeds: v.optional(v.number()),
    customAllocWants: v.optional(v.number()),
    customAllocSavings: v.optional(v.number()),
  },
  returns: v.id("specialIncomes"),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);
    requirePremium(profile.plan);

    if (args.amount <= 0) {
      throw new ConvexError("Amount must be greater than 0");
    }

    // Validate custom allocations sum to 100
    if (args.allocationStrategy === "custom") {
      if (
        args.customAllocNeeds === undefined ||
        args.customAllocWants === undefined ||
        args.customAllocSavings === undefined
      ) {
        throw new ConvexError(
          "Custom allocation requires all three percentages",
        );
      }
      const sum =
        args.customAllocNeeds +
        args.customAllocWants +
        args.customAllocSavings;
      if (Math.round(sum) !== 100) {
        throw new ConvexError("Custom allocations must sum to 100%");
      }
    }

    return await ctx.db.insert("specialIncomes", {
      profileId: profile._id,
      typeId: args.typeId,
      amount: args.amount,
      month: args.month,
      allocationStrategy: args.allocationStrategy,
      customAllocNeeds: args.customAllocNeeds,
      customAllocWants: args.customAllocWants,
      customAllocSavings: args.customAllocSavings,
    });
  },
});
