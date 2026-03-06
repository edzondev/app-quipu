import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getProfileOrThrow,
  currentMonthString,
  computeEnvelopes,
  todayString,
} from "./helpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Whether the current pay period has already been processed.
 * Monthly: last processed date is in the current YYYY-MM.
 * Biweekly: last processed date is in the same half of the current month
 *           (days 1-15 = first half, days 16+ = second half).
 */
function computeHasProcessed(
  lastPaydayProcessedAt: string | undefined,
  payFrequency: "monthly" | "biweekly",
  today: string,
  currentMonth: string,
): boolean {
  if (!lastPaydayProcessedAt) return false;
  if (!lastPaydayProcessedAt.startsWith(currentMonth)) return false;

  if (payFrequency === "monthly") return true;

  // Biweekly: same half?
  const todayDay = parseInt(today.slice(8, 10), 10);
  const processedDay = parseInt(lastPaydayProcessedAt.slice(8, 10), 10);
  const todayHalf = todayDay <= 15 ? "first" : "second";
  const processedHalf = processedDay <= 15 ? "first" : "second";
  return todayHalf === processedHalf;
}

/**
 * Returns the next payday date (YYYY-MM-DD) after today.
 */
function computeNextPaydayDate(paydays: number[], today: Date): string {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const dayOfMonth = today.getDate();

  const sortedPaydays = [...paydays].sort((a, b) => a - b);

  // Look for a payday in the current month that's strictly after today
  for (const payday of sortedPaydays) {
    if (payday > dayOfMonth) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const effectiveDay = Math.min(payday, daysInMonth);
      return new Date(year, month, effectiveDay).toISOString().slice(0, 10);
    }
  }

  // Wrap to next month's first payday
  const nextMonthIndex = month + 1;
  const nextYear = nextMonthIndex > 11 ? year + 1 : year;
  const effectiveMonth = nextMonthIndex % 12;
  const daysInNextMonth = new Date(nextYear, effectiveMonth + 1, 0).getDate();
  const effectiveDay = Math.min(sortedPaydays[0], daysInNextMonth);
  return new Date(nextYear, effectiveMonth, effectiveDay)
    .toISOString()
    .slice(0, 10);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Lightweight query for the payday page.
 * Returns current payday status and the minimum profile fields needed to
 * render the payday UI.
 */
export const getPaydayStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const today = todayString();
    const currentMonth = currentMonthString();
    const todayDate = new Date();
    const dayOfMonth = todayDate.getDate();
    const daysInMonth = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() + 1,
      0,
    ).getDate();
    const effectiveDay = Math.min(dayOfMonth, daysInMonth);
    const isPayday = profile.paydays.includes(effectiveDay);

    const hasProcessedCurrentPayday = computeHasProcessed(
      profile.lastPaydayProcessedAt,
      profile.payFrequency,
      today,
      currentMonth,
    );

    const nextPaydayDate = computeNextPaydayDate(profile.paydays, todayDate);
    const nextPaydayDateObj = new Date(nextPaydayDate + "T00:00:00");
    const todayDateObj = new Date(today + "T00:00:00");
    const daysUntilNextPayday = Math.round(
      (nextPaydayDateObj.getTime() - todayDateObj.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      isPayday,
      hasProcessedCurrentPayday,
      nextPaydayDate,
      daysUntilNextPayday,
      profile: {
        currencySymbol: profile.currencySymbol,
        monthlyIncome: profile.monthlyIncome,
        allocationNeeds: profile.allocationNeeds,
        allocationWants: profile.allocationWants,
        allocationSavings: profile.allocationSavings,
        payFrequency: profile.payFrequency,
        paydays: profile.paydays,
      },
    };
  },
});

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
    const today = todayString();

    // Pure date calculations — no I/O
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();
    const effectiveDay = Math.min(dayOfMonth, daysInMonth);
    const isPayday = profile.paydays.includes(effectiveDay);
    const daysRemaining = daysInMonth - dayOfMonth;

    const hasProcessedCurrentPayday = computeHasProcessed(
      profile.lastPaydayProcessedAt,
      profile.payFrequency,
      today,
      month,
    );

    // All DB reads are independent once we have profile._id — run in parallel
    const [computed, savingsSubEnvelopes, recentExpenses, streak, achievements, coachMessage] =
      await Promise.all([
        computeEnvelopes(ctx, profile, month),
        ctx.db
          .query("savingsSubEnvelopes")
          .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
          .collect(),
        ctx.db
          .query("expenses")
          .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
          .collect()
          .then((rows) =>
            [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
          ),
        ctx.db
          .query("streaks")
          .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
          .unique(),
        ctx.db
          .query("achievements")
          .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
          .collect(),
        ctx.db
          .query("coachMessages")
          .withIndex("by_profileId_read", (q) =>
            q.eq("profileId", profile._id).eq("read", false),
          )
          .order("desc")
          .first(),
      ]);

    // Post-fetch derivations (no I/O)
    const lastAchievement =
      [...achievements].sort((a, b) =>
        (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""),
      )[0] ?? null;

    const totalAllocated =
      computed.envelopes.needs.allocated + computed.envelopes.wants.allocated;
    const totalSpent =
      computed.envelopes.needs.spent + computed.envelopes.wants.spent;
    const budgetUsedPercent =
      totalAllocated > 0
        ? Math.round((totalSpent / totalAllocated) * 100)
        : 0;

    const needsOverflow = Math.max(
      0,
      computed.envelopes.needs.spent - computed.envelopes.needs.allocated,
    );
    const wantsOverflow = Math.max(
      0,
      computed.envelopes.wants.spent - computed.envelopes.wants.allocated,
    );
    const isInRescueMode = needsOverflow > 0 || wantsOverflow > 0;

    const totalAccumulatedSavings = savingsSubEnvelopes.reduce(
      (sum, s) => sum + s.currentAmount,
      0,
    );

    return {
      profile,
      isCoupleModeEnabled: profile.coupleModeEnabled,
      envelopes: {
        ...computed.envelopes,
        savings: {
          ...computed.envelopes.savings,
          subEnvelopes: savingsSubEnvelopes,
          totalAccumulatedSavings,
        },
      },
      isPayday,
      hasProcessedCurrentPayday,
      commitmentsForEnvelope: computed.totalFixed,
      today,
      month,
      recentExpenses,
      daysRemaining,
      budgetUsedPercent,
      rescueStatus: { isInRescueMode, needsOverflow, wantsOverflow },
      streak,
      lastAchievement,
      coachMessage,
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
              description: `Pausar aporte a Inversión este mes (S/ ${((netIncome * (profile.allocationSavings / 100)) / 3).toFixed(2)})`,
              amount: (netIncome * (profile.allocationSavings / 100)) / 3,
            },
          ].filter(Boolean)
        : [],
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Processes the payday allocation for the current period.
 * - Distributes savings into sub-envelopes
 * - Schedules the end-of-month streak evaluation
 * - Records the date so re-runs within the same period are no-ops (idempotent)
 */
export const processPayday = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);

    const today = todayString();
    const currentMonth = currentMonthString();

    // Idempotency guard — skip if already processed this period
    if (
      computeHasProcessed(
        profile.lastPaydayProcessedAt,
        profile.payFrequency,
        today,
        currentMonth,
      )
    ) {
      return null;
    }

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

    // Mark this period as processed
    await ctx.db.patch(profile._id, { lastPaydayProcessedAt: today });

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
