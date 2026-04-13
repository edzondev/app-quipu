import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  currentMonthString,
  getProfile,
  getProfileOrThrow,
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

    // When filtering by both envelope and month, use the composite index for efficient
    // range queries that avoid in-memory filtering of the paginated page.
    if (args.envelope && args.month) {
      return await ctx.db
        .query("expenses")
        .withIndex("by_profileId_envelope_date", (q) =>
          q
            .eq("profileId", profile._id)
            .eq("envelope", args.envelope!)
            .gte("date", `${args.month}-01`)
            .lt("date", `${args.month}-32`),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // When filtering by envelope only (no month), use the single-field envelope index.
    if (args.envelope) {
      return await ctx.db
        .query("expenses")
        .withIndex("by_profileId_envelope", (q) =>
          q.eq("profileId", profile._id).eq("envelope", args.envelope!),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // With month filter: use date-range index so pagination stays within the month.
    if (args.month) {
      return await ctx.db
        .query("expenses")
        .withIndex("by_profileId_date", (q) =>
          q
            .eq("profileId", profile._id)
            .gte("date", `${args.month}-01`)
            .lt("date", `${args.month}-32`),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // No filters — paginate all expenses for this profile
    return await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .paginate(args.paginationOpts);
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
  returns: v.union(
    v.null(),
    v.object({
      total: v.number(),
      needs: v.number(),
      wants: v.number(),
      juntos: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const month = args.month ?? currentMonthString();

    const monthExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId_date", (q) =>
        q
          .eq("profileId", profile._id)
          .gte("date", `${month}-01`)
          .lt("date", `${month}-32`),
      )
      .collect();

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
  args: {
    month: v.optional(v.string()), // "YYYY-MM" — pass from client for deterministic caching
  },
  returns: v.union(v.null(), v.number()),
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const month = args.month ?? currentMonthString();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId_date", (q) =>
        q
          .eq("profileId", profile._id)
          .gte("date", `${month}-01`)
          .lt("date", `${month}-32`),
      )
      .collect();

    return expenses.length;
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
    bucket: v.optional(
      v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
    ),
    module: v.optional(v.string()),
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
        .withIndex("by_profileId_date", (q) =>
          q
            .eq("profileId", profile._id)
            .gte("date", `${month}-01`)
            .lt("date", `${month}-32`),
        )
        .collect();

      if (monthExpenses.length >= FREE_PLAN_MONTHLY_LIMIT) {
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
      bucket: args.bucket,
      module: args.module,
      date: args.date ?? todayString(),
      registeredBy: args.registeredBy ?? "user",
    });

    // Count total expenses for achievement tracking (all-time, not just current month)
    const totalExpenseCount = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect()
      .then((rows) => rows.length);
    await unlockExpenseAchievements(ctx, profile._id, totalExpenseCount);

    return expenseId;
  },
});

/**
 * Updates an existing expense. Verifies ownership via the profile relationship.
 * Only the provided fields are updated (partial patch).
 */
export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    amount: v.optional(v.number()),
    envelope: v.optional(
      v.union(v.literal("needs"), v.literal("wants"), v.literal("juntos")),
    ),
    bucket: v.optional(
      v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
    ),
    module: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.profileId !== profile._id) {
      throw new ConvexError("Expense not found");
    }

    if (args.amount !== undefined && args.amount <= 0) {
      throw new ConvexError("Amount must be greater than 0");
    }

    if (args.envelope === "juntos" && !profile.coupleModeEnabled) {
      throw new ConvexError("Couple mode is not enabled");
    }

    const patch: Record<string, unknown> = {};
    if (args.amount !== undefined) patch.amount = args.amount;
    if (args.envelope !== undefined) patch.envelope = args.envelope;
    if (args.bucket !== undefined) patch.bucket = args.bucket;
    if (args.module !== undefined) patch.module = args.module;
    if (args.description !== undefined) patch.description = args.description;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.expenseId, patch);
    }

    return null;
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
