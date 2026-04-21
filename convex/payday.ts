import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import {
  computeEnvelopes,
  computePauseMode,
  currentMonthString,
  distributeSavingsToSubEnvelopes,
  getProfileOrThrow,
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
  args: {
    month: v.optional(v.string()), // "YYYY-MM" — pass from client for deterministic caching
    today: v.optional(v.string()), // "YYYY-MM-DD"
  },
  returns: v.union(
    v.null(),
    v.object({
      isPayday: v.boolean(),
      hasProcessedCurrentPayday: v.boolean(),
      nextPaydayDate: v.string(),
      daysUntilNextPayday: v.number(),
      profile: v.object({
        currencySymbol: v.string(),
        monthlyIncome: v.number(),
        allocationNeeds: v.number(),
        allocationWants: v.number(),
        allocationSavings: v.number(),
        payFrequency: v.union(v.literal("monthly"), v.literal("biweekly")),
        paydays: v.array(v.number()),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const today = args.today ?? todayString();
    const currentMonth = args.month ?? currentMonthString();
    const todayDate = new Date(`${today}T00:00:00Z`);
    const dayOfMonth = todayDate.getDate();
    const daysInMonth = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() + 1,
      0,
    ).getDate();
    const paydays = profile.paydays ?? [];
    const payFrequency = profile.payFrequency ?? "monthly";

    const effectiveDay = Math.min(dayOfMonth, daysInMonth);
    const isPayday = paydays.includes(effectiveDay);

    const hasProcessedCurrentPayday = computeHasProcessed(
      profile.lastPaydayProcessedAt,
      payFrequency,
      today,
      currentMonth,
    );

    const nextPaydayDate =
      paydays.length > 0 ? computeNextPaydayDate(paydays, todayDate) : today;
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
        monthlyIncome: profile.monthlyIncome ?? 0,
        allocationNeeds: profile.allocationNeeds,
        allocationWants: profile.allocationWants,
        allocationSavings: profile.allocationSavings,
        payFrequency,
        paydays,
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
  args: {
    month: v.optional(v.string()), // "YYYY-MM" — pass from client for deterministic caching
    today: v.optional(v.string()), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    // Soft auth check — return null instead of throwing.
    // The layout/page handles null by redirecting to onboarding.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const month = args.month ?? currentMonthString();
    const today = args.today ?? todayString();

    // Pure date calculations — no I/O
    const todayDate = new Date(`${today}T00:00:00Z`);
    const dayOfMonth = todayDate.getUTCDate();
    const daysInMonth = new Date(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth() + 1,
      0,
    ).getDate();
    const paydays = profile.paydays ?? [];
    const payFrequency = profile.payFrequency ?? "monthly";

    const effectiveDay = Math.min(dayOfMonth, daysInMonth);
    const isPayday = paydays.includes(effectiveDay);
    const daysRemaining = daysInMonth - dayOfMonth;

    const hasProcessedCurrentPayday = computeHasProcessed(
      profile.lastPaydayProcessedAt,
      payFrequency,
      today,
      month,
    );

    // All DB reads are independent once we have profile._id — run in parallel
    const [
      computed,
      savingsSubEnvelopes,
      recentExpenses,
      streak,
      achievements,
      coachMessage,
      pauseMode,
    ] = await Promise.all([
      computeEnvelopes(ctx, profile, month),
      ctx.db
        .query("savingsSubEnvelopes")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_profileId_date", (q) => q.eq("profileId", profile._id))
        .order("desc")
        .take(20),
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
      computePauseMode(ctx, profile),
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
      totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

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
      pauseMode,
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
  returns: v.number(),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);

    const today = todayString();
    const currentMonth = currentMonthString();

    // Idempotency guard — skip if already processed this period
    if (
      computeHasProcessed(
        profile.lastPaydayProcessedAt,
        profile.payFrequency ?? "monthly",
        today,
        currentMonth,
      )
    ) {
      return profile.distributionsCompleted ?? 0;
    }

    const [commitments, extraIncomes] = await Promise.all([
      ctx.db
        .query("fixedCommitments")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("extraIncomes")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect(),
    ]);

    const totalFixed = commitments.reduce((sum, c) => sum + c.amount, 0);
    const extraIncomesTotal = extraIncomes
      .filter((e) => e.includeInBudget)
      .reduce((sum, e) => sum + e.amount, 0);
    const netIncome =
      (profile.monthlyIncome ?? 0) + extraIncomesTotal - totalFixed;
    const savingsAmount = netIncome * (profile.allocationSavings / 100);

    // Si el usuario activó Modo Rescate este mes, omitir distribución de ahorro
    if (profile.rescuePausedSavingsMonth !== currentMonth) {
      await distributeSavingsToSubEnvelopes(ctx, profile._id, savingsAmount);
    }

    // Mark this period as processed and increment distribution counter
    const newDistributionsCompleted = (profile.distributionsCompleted ?? 0) + 1;
    await ctx.db.patch(profile._id, {
      lastPaydayProcessedAt: today,
      distributionsCompleted: newDistributionsCompleted,
    });

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

    return newDistributionsCompleted;
  },
});

/**
 * Registers an ad-hoc income for independent workers.
 * Distributes the amount across envelopes based on allocation percentages
 * and accumulates into the profile's envelope fields.
 */
export const registerIncome = mutation({
  args: {
    amount: v.number(),
  },
  returns: v.object({
    needs: v.number(),
    wants: v.number(),
    savings: v.number(),
    distributionsCompleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    if (profile.workerType !== "independent") {
      throw new ConvexError(
        "registerIncome solo está disponible para trabajadores independientes",
      );
    }

    if (args.amount <= 0) {
      throw new ConvexError("El monto debe ser mayor a 0");
    }

    const needs = args.amount * (profile.allocationNeeds / 100);
    const wants = args.amount * (profile.allocationWants / 100);
    const savings = args.amount * (profile.allocationSavings / 100);

    const newDistributionsCompleted = (profile.distributionsCompleted ?? 0) + 1;
    await ctx.db.patch(profile._id, {
      envelopeNeeds: (profile.envelopeNeeds ?? 0) + needs,
      envelopeWants: (profile.envelopeWants ?? 0) + wants,
      envelopeSavings: (profile.envelopeSavings ?? 0) + savings,
      distributionsCompleted: newDistributionsCompleted,
    });

    // Distribute savings into sub-envelopes
    await distributeSavingsToSubEnvelopes(ctx, profile._id, savings);

    return {
      needs,
      wants,
      savings,
      distributionsCompleted: newDistributionsCompleted,
    };
  },
});
