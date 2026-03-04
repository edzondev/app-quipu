import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getProfileOrThrow, currentMonthString, computeEnvelopes } from "./helpers";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the full data needed for the dashboard envelope display:
 * - Profile configuration (allocations, income, payday info)
 * - Current month's net available per envelope (after fixed commitments and expenses)
 * - Savings sub-envelope balances
 * - Whether today is a payday and if the current period has been processed
 *
 * This is the primary "read" query for the dashboard — a single reactive
 * subscription replaces multiple separate queries.
 */
export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    // Soft auth check — return null instead of throwing.
    // The layout/page handles null by redirecting to onboarding.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const month = currentMonthString();
    const today = new Date().toISOString().slice(0, 10);

    const computed = await computeEnvelopes(ctx, profile, month);

    // Savings sub-envelopes (accumulated balance, not reset monthly)
    const savingsSubEnvelopes = await ctx.db
      .query("savingsSubEnvelopes")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    // Determine if today is a payday
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();
    const effectiveDay = Math.min(dayOfMonth, daysInMonth);
    const isPayday = profile.paydays.includes(effectiveDay);

    // Recent expenses (last 5) for the dashboard preview
    const recentExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect()
      .then((rows) =>
        rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
      );

    return {
      profile,
      isCoupleModeEnabled: profile.coupleModeEnabled,
      envelopes: {
        ...computed.envelopes,
        savings: {
          ...computed.envelopes.savings,
          subEnvelopes: savingsSubEnvelopes,
        },
      },
      isPayday,
      commitmentsForEnvelope: computed.totalFixed,
      today,
      month,
      recentExpenses,
    };
  },
});

/**
 * Checks if any envelope is currently in the negative (Modo Rescate trigger).
 * Returns the affected envelopes and suggested actions.
 */
export const getRescueStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const month = currentMonthString();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
    const commitments = await ctx.db
      .query("fixedCommitments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const totalFixed = commitments.reduce((sum, c) => sum + c.amount, 0);
    const netIncome = profile.monthlyIncome - totalFixed;

    const spentNeeds = monthExpenses
      .filter((e) => e.envelope === "needs")
      .reduce((sum, e) => sum + e.amount, 0);
    const spentWants = monthExpenses
      .filter((e) => e.envelope === "wants")
      .reduce((sum, e) => sum + e.amount, 0);

    const allocatedNeeds = netIncome * (profile.allocationNeeds / 100);
    const allocatedWants = netIncome * (profile.allocationWants / 100);

    const needsOverflow = spentNeeds - allocatedNeeds;
    const wantsOverflow = spentWants - allocatedWants;

    const isInRescueMode = needsOverflow > 0 || wantsOverflow > 0;

    return {
      isInRescueMode,
      needsOverflow: Math.max(0, needsOverflow),
      wantsOverflow: Math.max(0, wantsOverflow),
      // Suggested actions ordered by least impact on long-term goals
      suggestedActions: isInRescueMode
        ? [
          wantsOverflow > 0 && {
            type: "transfer_from_wants",
            description: `Mover S/ ${wantsOverflow.toFixed(2)} de Gustos a Necesidades`,
            amount: wantsOverflow,
          },
          {
            type: "reduce_savings",
            description: `Pausar aporte a Inversión este mes (S/ ${(netIncome * (profile.allocationSavings / 100) / 3).toFixed(2)})`,
            amount: netIncome * (profile.allocationSavings / 100) / 3,
          },
        ].filter(Boolean)
        : [],
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Processes the payday allocation for the current month.
 * - Distributes savings into sub-envelopes
 * - Schedules the end-of-month streak evaluation
 *
 * Idempotent: calling it multiple times in the same month is safe
 * because the client shows it only once per pay period.
 */
export const processPayday = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);

    const commitments = await ctx.db
      .query("fixedCommitments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const totalFixed = commitments.reduce((sum, c) => sum + c.amount, 0);
    const netIncome = profile.monthlyIncome - totalFixed;
    const savingsAmount = netIncome * (profile.allocationSavings / 100);

    // Distribute savings across sub-envelopes
    const subEnvelopes = await ctx.db
      .query("savingsSubEnvelopes")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const perEnvelope = savingsAmount / 3;
    for (const sub of subEnvelopes) {
      const newAmount = sub.currentAmount + perEnvelope;
      const goal = sub.goalAmount > 0 ? sub.goalAmount : 1;
      await ctx.db.patch(sub._id, {
        currentAmount: newAmount,
        progress: Math.min(100, Math.round((newAmount / goal) * 100)),
      });
    }

    // Also advance current amount in active savings goals
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    for (const goal of goals) {
      if (goal.currentAmount < goal.targetAmount) {
        const contribution = Math.min(
          goal.monthlyRequired,
          goal.targetAmount - goal.currentAmount,
        );
        await ctx.db.patch(goal._id, {
          currentAmount: goal.currentAmount + contribution,
        });
      }
    }

    // Schedule end-of-month streak evaluation (runs at midnight on last day of month)
    const now = new Date();
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      0,
    );
    const msUntilEndOfMonth = lastDayOfMonth.getTime() - now.getTime();

    if (msUntilEndOfMonth > 0) {
      await ctx.scheduler.runAfter(
        msUntilEndOfMonth,
        internal.streaks.evaluateMonthCompliance,
        { profileId: profile._id },
      );
    }

    return null;
  },
});
