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
 *
 * Note: avoid calling this inside Convex *queries* (it uses Date.now() which
 * breaks deterministic caching). Prefer passing the month as a query argument
 * from the client instead. Safe to call from mutations and actions.
 */
export function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

export type ComputeEnvelopesProfile = {
  _id: import("./_generated/dataModel").Id<"profiles">;
  workerType: "dependent" | "independent";
  monthlyIncome?: number;
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
  rescueActionId?: string;
  rescueAppliedAt?: number;
};

export type FixedCommitmentInput = {
  envelope: "needs" | "wants";
  amount: number;
};

export type ExpenseInput = {
  envelope: "needs" | "wants" | "juntos";
  amount: number;
};

export type ComputeEnvelopesResult = {
  fixedNeeds: number;
  fixedWants: number;
  totalFixed: number;
  netIncome: number;
  envelopes: {
    needs: {
      allocated: number;
      fixedCommitments: number;
      spent: number;
      available: number;
    };
    wants: {
      allocated: number;
      fixedCommitments: number;
      spent: number;
      available: number;
    };
    savings: {
      allocated: number;
    };
    juntos: {
      budget: number;
      spent: number;
      available: number;
    } | null;
  };
};

/**
 * Pure computation behind computeEnvelopes. Accepts already-loaded
 * commitments and expenses so it can be unit-tested without a Convex ctx.
 */
export function computeEnvelopesFromData(
  profile: ComputeEnvelopesProfile,
  month: string,
  commitments: FixedCommitmentInput[],
  expenses: ExpenseInput[],
): ComputeEnvelopesResult {
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
      netIncome = (profile.monthlyIncome ?? 0) - (fixedNeeds + fixedWants);
    }
    allocatedNeeds = netIncome * (profile.allocationNeeds / 100);
    allocatedWants = netIncome * (profile.allocationWants / 100);
    allocatedSavings = netIncome * (profile.allocationSavings / 100);

    // Apply rescue transfer offsets for dependent workers.
    // When rescue "transfer_from_savings" is applied this month,
    // envelopeNeeds/Wants fields hold the transferred amount — add as allocation delta.
    const rescueMonth =
      profile.rescueAppliedAt !== undefined
        ? new Date(profile.rescueAppliedAt).toISOString().slice(0, 7)
        : null;
    if (
      profile.rescueActionId === "transfer_from_savings" &&
      rescueMonth === month
    ) {
      const rescueNeeds = profile.envelopeNeeds ?? 0;
      const rescueWants = profile.envelopeWants ?? 0;
      allocatedNeeds = allocatedNeeds + rescueNeeds;
      allocatedWants = allocatedWants + rescueWants;
      allocatedSavings = Math.max(
        0,
        allocatedSavings - rescueNeeds - rescueWants,
      );
    }
  }

  const spentNeeds = expenses
    .filter((e) => e.envelope === "needs")
    .reduce((sum, e) => sum + e.amount, 0);
  const spentWants = expenses
    .filter((e) => e.envelope === "wants")
    .reduce((sum, e) => sum + e.amount, 0);
  const spentJuntos = expenses
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
 * Computes envelope balances for a given profile and month.
 * Shared between getDashboardData and getEnvelopes to avoid duplication.
 *
 * Returns allocated/spent/available per envelope plus juntos when couple mode
 * is active. `juntos` is null when couple mode is disabled.
 */
export async function computeEnvelopes(
  ctx: QueryCtx | MutationCtx,
  profile: ComputeEnvelopesProfile,
  month: string,
): Promise<ComputeEnvelopesResult> {
  const commitments = await ctx.db
    .query("fixedCommitments")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();

  const allMonthExpenses = await ctx.db
    .query("expenses")
    .withIndex("by_profileId_date", (q) =>
      q
        .eq("profileId", profile._id)
        .gte("date", `${month}-01`)
        .lt("date", `${month}-32`),
    )
    .collect();

  return computeEnvelopesFromData(
    profile,
    month,
    commitments,
    allMonthExpenses,
  );
}

/**
 * Returns YYYY-MM-DD string for today (UTC).
 */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export type PauseModeProfile = {
  _id: import("./_generated/dataModel").Id<"profiles">;
  pauseModeActive?: boolean;
  pauseModeFund?: number;
  pauseModeStartedAt?: string;
};

export type PauseModeResult = {
  active: true;
  fund: number;
  startedAt: string;
  spent: number;
  remaining: number;
} | null;

/**
 * Pure computation behind computePauseMode. Sums expenses since the pause
 * start date without touching the database.
 */
export function computePauseModeFromData(
  profile: PauseModeProfile,
  expensesSinceStart: ExpenseInput[],
): PauseModeResult {
  if (
    profile.pauseModeActive !== true ||
    profile.pauseModeFund === undefined ||
    profile.pauseModeStartedAt === undefined
  ) {
    return null;
  }

  const fund = profile.pauseModeFund;
  const startedAt = profile.pauseModeStartedAt;
  const spent = expensesSinceStart.reduce((sum, e) => sum + e.amount, 0);

  return {
    active: true,
    fund,
    startedAt,
    spent,
    remaining: fund - spent,
  };
}

/**
 * Computes the Modo Pausa snapshot for a profile.
 *
 * When pause mode is not active (or the required fields are missing), returns
 * null. Otherwise sums every expense since `pauseModeStartedAt` (cross-month)
 * and returns the initial fund, spent total, and remaining balance.
 *
 * Shared between getPauseStatus and getDashboardData to avoid duplication.
 */
export async function computePauseMode(
  ctx: QueryCtx | MutationCtx,
  profile: PauseModeProfile,
): Promise<PauseModeResult> {
  if (
    profile.pauseModeActive !== true ||
    profile.pauseModeFund === undefined ||
    profile.pauseModeStartedAt === undefined
  ) {
    return null;
  }

  const startedAt = profile.pauseModeStartedAt;
  const expensesSinceStart = await ctx.db
    .query("expenses")
    .withIndex("by_profileId_date", (q) =>
      q.eq("profileId", profile._id).gte("date", startedAt),
    )
    .collect();

  return computePauseModeFromData(profile, expensesSinceStart);
}

/**
 * Returns the positive carryover available in operational envelopes when
 * entering Modo Pausa.
 *
 * Only needs and wants are considered. Negative availability does not reduce
 * carryover (clamped to 0 per envelope).
 */
export function computePauseModeCarryoverFromEnvelopes(
  computed: ComputeEnvelopesResult,
): number {
  const needsAvailable = Math.max(0, computed.envelopes.needs.available);
  const wantsAvailable = Math.max(0, computed.envelopes.wants.available);
  return needsAvailable + wantsAvailable;
}

export type SavingsSubEnvelopeInput = {
  _id: import("./_generated/dataModel").Id<"savingsSubEnvelopes">;
  currentAmount: number;
  goalAmount: number;
  progress: number;
};

export type SavingsGoalInput = {
  _id: import("./_generated/dataModel").Id<"savingsGoals">;
  currentAmount: number;
  targetAmount: number;
  monthlyRequired: number;
};

export type SavingsDistributionResult = {
  subEnvelopes: SavingsSubEnvelopeInput[];
  goals: SavingsGoalInput[];
};

/**
 * Pure computation behind distributeSavingsToSubEnvelopes. Returns the new
 * state of sub-envelopes and goals without writing to the database.
 */
export function distributeSavingsFromData(
  savingsAmount: number,
  subEnvelopes: SavingsSubEnvelopeInput[],
  savingsGoals: SavingsGoalInput[],
): SavingsDistributionResult {
  if (savingsAmount <= 0) {
    return { subEnvelopes: [...subEnvelopes], goals: [...savingsGoals] };
  }

  const perEnvelope = savingsAmount / 3;
  const updatedSubEnvelopes = subEnvelopes.map((sub) => {
    const newAmount = sub.currentAmount + perEnvelope;
    const goal = sub.goalAmount > 0 ? sub.goalAmount : 1;
    return {
      ...sub,
      currentAmount: newAmount,
      progress: Math.min(100, Math.round((newAmount / goal) * 100)),
    };
  });

  const updatedGoals = savingsGoals.map((goal) => {
    if (goal.currentAmount < goal.targetAmount) {
      const contribution = Math.min(
        goal.monthlyRequired,
        goal.targetAmount - goal.currentAmount,
      );
      return {
        ...goal,
        currentAmount: goal.currentAmount + contribution,
      };
    }
    return { ...goal };
  });

  return { subEnvelopes: updatedSubEnvelopes, goals: updatedGoals };
}

/**
 * Distributes a savings amount equally across all three savings sub-envelopes
 * (emergency, short_term, investment) for the given profile.
 * Also advances active savings goals by their monthly required amount.
 *
 * Shared by processPayday, registerIncome, and registerSpecialIncome to avoid
 * logic drift across callsites.
 */
export async function distributeSavingsToSubEnvelopes(
  ctx: MutationCtx,
  profileId: import("./_generated/dataModel").Id<"profiles">,
  savingsAmount: number,
): Promise<void> {
  const subEnvelopes = await ctx.db
    .query("savingsSubEnvelopes")
    .withIndex("by_profileId", (q) => q.eq("profileId", profileId))
    .collect();

  const savingsGoals = await ctx.db
    .query("savingsGoals")
    .withIndex("by_profileId", (q) => q.eq("profileId", profileId))
    .collect();

  const { subEnvelopes: updatedSubEnvelopes, goals: updatedGoals } =
    distributeSavingsFromData(savingsAmount, subEnvelopes, savingsGoals);

  for (const sub of updatedSubEnvelopes) {
    await ctx.db.patch(sub._id, {
      currentAmount: sub.currentAmount,
      progress: sub.progress,
    });
  }

  for (const goal of updatedGoals) {
    await ctx.db.patch(goal._id, {
      currentAmount: goal.currentAmount,
    });
  }
}
