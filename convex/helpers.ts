import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Returns the authenticated user's profile, or null if not authenticated
 * or the profile doesn't exist yet.
 *
 * Use this in queries that may run before onboarding is complete.
 * The client handles null by redirecting to onboarding.
 */
export async function getProfile(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique();
}

/**
 * Returns the authenticated user's profile, or throws ConvexError if:
 * - not authenticated
 * - profile doesn't exist yet (onboarding not completed)
 *
 * Use this in mutations where the profile must exist to operate.
 * `identity.subject` is the Better Auth user._id stored in profiles.userId
 */
export async function getProfileOrThrow(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique();

  if (!profile) {
    throw new ConvexError("Profile not found");
  }

  return profile;
}

/**
 * Returns the authenticated user's userId (Better Auth user._id), or throws.
 * Use this when you need the ID but not the profile (e.g., during onboarding).
 */
export async function getAuthUserIdOrThrow(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }
  return identity.subject;
}

/**
 * Throws if the profile's plan is not "premium".
 * Call after getProfileOrThrow.
 */
export function requirePremium(plan: "free" | "premium") {
  if (plan !== "premium") {
    throw new ConvexError("This feature requires a premium plan");
  }
}

/**
 * Returns YYYY-MM string for the current month (UTC).
 */
export function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Computes envelope balances for a given profile and month.
 * Shared between getDashboardData and getEnvelopes to avoid duplication.
 *
 * Returns allocated/spent/available per envelope plus juntos when couple mode
 * is active. `juntos` is null when couple mode is disabled.
 */
export async function computeEnvelopes(
  ctx: QueryCtx | MutationCtx,
  profile: {
    _id: import("./_generated/dataModel").Id<"profiles">;
    workerType: "dependent" | "independent";
    monthlyIncome: number;
    allocationNeeds: number;
    allocationWants: number;
    allocationSavings: number;
    coupleModeEnabled: boolean;
    coupleMonthlyBudget: number;
    envelopeNeeds?: number;
    envelopeWants?: number;
    envelopeSavings?: number;
    initialRemainingBudget?: number;
    initialBudgetMonth?: string;
    lastPaydayProcessedAt?: string;
  },
  month: string,
) {
  const commitments = await ctx.db
    .query("fixedCommitments")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();

  const fixedNeeds = commitments
    .filter((c) => c.envelope === "needs")
    .reduce((sum, c) => sum + c.amount, 0);
  const fixedWants = commitments
    .filter((c) => c.envelope === "wants")
    .reduce((sum, c) => sum + c.amount, 0);

  let allocatedNeeds: number;
  let allocatedWants: number;
  let allocatedSavings: number;
  let netIncome: number;

  if (profile.workerType === "independent") {
    // Independent workers: use accumulated envelope fields
    allocatedNeeds = profile.envelopeNeeds ?? 0;
    allocatedWants = profile.envelopeWants ?? 0;
    allocatedSavings = profile.envelopeSavings ?? 0;
    netIncome = allocatedNeeds + allocatedWants + allocatedSavings;
  } else {
    // Dependent workers: calculate from monthly income
    // If user signed up mid-month and reported remaining budget, use that
    // instead of full salary until the first payday is processed.
    const isFirstPartialMonth =
      profile.initialRemainingBudget !== undefined &&
      profile.initialBudgetMonth === month &&
      !profile.lastPaydayProcessedAt;

    if (isFirstPartialMonth) {
      // User reported what they truly have left — already net of spent money
      // Don't subtract fixed commitments again
      netIncome = profile.initialRemainingBudget ?? 0;
    } else {
      netIncome = profile.monthlyIncome - (fixedNeeds + fixedWants);
    }
    allocatedNeeds = netIncome * (profile.allocationNeeds / 100);
    allocatedWants = netIncome * (profile.allocationWants / 100);
    allocatedSavings = netIncome * (profile.allocationSavings / 100);
  }

  const allMonthExpenses = await ctx.db
    .query("expenses")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect()
    .then((rows) => rows.filter((e) => e.date.startsWith(month)));

  const spentNeeds = allMonthExpenses
    .filter((e) => e.envelope === "needs")
    .reduce((sum, e) => sum + e.amount, 0);
  const spentWants = allMonthExpenses
    .filter((e) => e.envelope === "wants")
    .reduce((sum, e) => sum + e.amount, 0);
  const spentJuntos = allMonthExpenses
    .filter((e) => e.envelope === "juntos")
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    fixedNeeds,
    fixedWants,
    totalFixed: fixedNeeds + fixedWants,
    netIncome,
    envelopes: {
      needs: {
        allocated: allocatedNeeds,
        fixedCommitments: fixedNeeds,
        spent: spentNeeds,
        available: allocatedNeeds - spentNeeds,
      },
      wants: {
        allocated: allocatedWants,
        fixedCommitments: fixedWants,
        spent: spentWants,
        available: allocatedWants - spentWants,
      },
      savings: {
        allocated: allocatedSavings,
      },
      juntos: profile.coupleModeEnabled
        ? {
            budget: profile.coupleMonthlyBudget,
            spent: spentJuntos,
            available: profile.coupleMonthlyBudget - spentJuntos,
          }
        : null,
    },
  };
}

/**
 * Returns YYYY-MM-DD string for today (UTC).
 */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
