import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import {
  getProfile,
  getProfileOrThrow,
  currentMonthString,
  todayString,
} from "./helpers";
import { unlockExpenseAchievements } from "./streaks";

// Free plan limit: 20 expenses per month
const FREE_PLAN_MONTHLY_LIMIT = 20;

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Paginated expense list. Optionally filter by envelope or date prefix ("YYYY-MM").
 * Used in the Gastos screen and dashboard recent expenses.
 */
export const listExpenses = query({
  args: {
    paginationOpts: paginationOptsValidator,
    envelope: v.optional(
      v.union(v.literal("needs"), v.literal("wants"), v.literal("juntos")),
    ),
    month: v.optional(v.string()), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    // When filtering by envelope, use the dedicated index
    if (args.envelope) {
      const results = await ctx.db
        .query("expenses")
        .withIndex("by_profileId_envelope", (q) =>
          q.eq("profileId", profile._id).eq("envelope", args.envelope!),
        )
        .order("desc")
        .paginate(args.paginationOpts);

      // Additional month filter in memory (Convex indexes don't support multi-range)
      if (args.month) {
        return {
          ...results,
          page: results.page.filter((e) => e.date.startsWith(args.month!)),
        };
      }
      return results;
    }

    // No envelope filter — use profileId index and filter month in memory
    const results = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .paginate(args.paginationOpts);

    if (args.month) {
      return {
        ...results,
        page: results.page.filter((e) => e.date.startsWith(args.month!)),
      };
    }
    return results;
  },
});

/**
 * Returns totals per envelope for a given month ("YYYY-MM").
 * Used for calculating available balance in each envelope.
 */
export const getMonthlyTotals = query({
  args: {
    month: v.optional(v.string()), // defaults to current month
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const month = args.month ?? currentMonthString();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const monthExpenses = expenses.filter((e) => e.date.startsWith(month));

    return {
      total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      needs: monthExpenses
        .filter((e) => e.envelope === "needs")
        .reduce((sum, e) => sum + e.amount, 0),
      wants: monthExpenses
        .filter((e) => e.envelope === "wants")
        .reduce((sum, e) => sum + e.amount, 0),
      juntos: monthExpenses
        .filter((e) => e.envelope === "juntos")
        .reduce((sum, e) => sum + e.amount, 0),
    };
  },
});

/**
 * Returns the count of expenses for the current month.
 * Used by the client to show the free plan limit warning (20/month).
 */
export const getCurrentMonthCount = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const month = currentMonthString();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    return expenses.filter((e) => e.date.startsWith(month)).length;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Registers a new expense. Enforces the free plan limit of 20/month.
 * The `registeredBy` field is set to "partner" when in couple mode and the
 * partner registers the expense (future: via shared session token).
 */
export const registerExpense = mutation({
  args: {
    amount: v.number(),
    description: v.optional(v.string()),
    envelope: v.union(
      v.literal("needs"),
      v.literal("wants"),
      v.literal("juntos"),
    ),
    date: v.optional(v.string()), // "YYYY-MM-DD", defaults to today
    registeredBy: v.optional(v.union(v.literal("user"), v.literal("partner"))),
  },
  returns: v.id("expenses"),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    if (args.amount <= 0) {
      throw new ConvexError("Amount must be greater than 0");
    }

    // Enforce free plan limit
    if (profile.plan === "free") {
      const month = currentMonthString();
      const monthExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect();

      const count = monthExpenses.filter((e) =>
        e.date.startsWith(month),
      ).length;

      if (count >= FREE_PLAN_MONTHLY_LIMIT) {
        throw new ConvexError(
          `Free plan limit: ${FREE_PLAN_MONTHLY_LIMIT} expenses per month`,
        );
      }
    }

    // "juntos" envelope requires couple mode enabled
    if (args.envelope === "juntos" && !profile.coupleModeEnabled) {
      throw new ConvexError("Couple mode is not enabled");
    }

    const expenseId = await ctx.db.insert("expenses", {
      profileId: profile._id,
      amount: args.amount,
      description: args.description,
      envelope: args.envelope,
      date: args.date ?? todayString(),
      registeredBy: args.registeredBy ?? "user",
    });

    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
    await unlockExpenseAchievements(ctx, profile._id, allExpenses.length);

    return expenseId;
  },
});

/**
 * Deletes an expense. Verifies ownership via the profile relationship.
 */
export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.profileId !== profile._id) {
      throw new ConvexError("Expense not found");
    }

    await ctx.db.delete(args.expenseId);
    return null;
  },
});
