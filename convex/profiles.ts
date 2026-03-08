import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserIdOrThrow, getProfileOrThrow } from "./helpers";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the current user's profile, or null if not created yet.
 * The client uses null to decide whether to show the onboarding flow.
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Called at the end of onboarding to create the user's profile.
 * Prevents duplicate profiles by checking if one already exists.
 */
export const createProfile = mutation({
  args: {
    name: v.string(),
    country: v.string(),
    currencyCode: v.string(),
    currencySymbol: v.string(),
    currencyName: v.string(),
    currencyLocale: v.string(),
    workerType: v.union(v.literal("dependent"), v.literal("independent")),
    payFrequency: v.optional(
      v.union(v.literal("monthly"), v.literal("biweekly")),
    ),
    paydays: v.optional(v.array(v.number())),
    monthlyIncome: v.number(),
    estimatedMonthlyIncome: v.optional(v.number()),
    // Allocation defaults to 50/30/20 if not provided
    allocationNeeds: v.optional(v.number()),
    allocationWants: v.optional(v.number()),
    allocationSavings: v.optional(v.number()),
    // Savings goal targets (computed from income on the client)
    savingsGoalEmergency: v.optional(v.number()),
    savingsGoalInvestment: v.optional(v.number()),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserIdOrThrow(ctx);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { onboardingComplete: true });
      return existing._id;
    }

    const profileId = await ctx.db.insert("profiles", {
      userId,
      name: args.name,
      country: args.country,
      currencyCode: args.currencyCode,
      currencySymbol: args.currencySymbol,
      currencyName: args.currencyName,
      currencyLocale: args.currencyLocale,
      workerType: args.workerType,
      payFrequency: args.payFrequency,
      paydays: args.paydays,
      monthlyIncome: args.monthlyIncome,
      estimatedMonthlyIncome: args.estimatedMonthlyIncome,
      allocationNeeds: args.allocationNeeds ?? 50,
      allocationWants: args.allocationWants ?? 30,
      allocationSavings: args.allocationSavings ?? 20,
      savingsGoalEmergency: args.savingsGoalEmergency ?? 0,
      //savingsGoalShortTerm: 0,
      savingsGoalInvestment: args.savingsGoalInvestment ?? 0,
      coupleModeEnabled: false,
      couplePartnerName: "",
      coupleMonthlyBudget: 0,
      onboardingComplete: false,
      plan: "free",
    });

    // Seed the three savings sub-envelopes
    await ctx.db.insert("savingsSubEnvelopes", {
      profileId,
      subEnvelopeId: "emergency",
      label: "Fondo de Emergencia",
      icon: "🛡️",
      currentAmount: 0,
      goalAmount: args.savingsGoalEmergency ?? 0,
      progress: 0,
    });
    await ctx.db.insert("savingsSubEnvelopes", {
      profileId,
      subEnvelopeId: "short_term",
      label: "Objetivos a Corto Plazo",
      icon: "🎯",
      currentAmount: 0,
      goalAmount: 0,
      progress: 0,
    });
    await ctx.db.insert("savingsSubEnvelopes", {
      profileId,
      subEnvelopeId: "investment",
      label: "Inversión",
      icon: "📈",
      currentAmount: 0,
      goalAmount: args.savingsGoalInvestment ?? 0,
      progress: 0,
    });

    // Seed the initial streak record
    await ctx.db.insert("streaks", {
      profileId,
      currentStreak: 0,
      longestStreak: 0,
    });

    return profileId;
  },
});

/**
 * Marks onboarding as complete. Called after createProfile when the user
 * finishes the onboarding flow.
 */
export const completeOnboarding = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);
    await ctx.db.patch(profile._id, { onboardingComplete: true });
    return null;
  },
});

/**
 * Updates profile settings. All fields are optional — only provided fields
 * are patched. Validates that allocation percentages sum to 100 when all three
 * are provided.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    monthlyIncome: v.optional(v.number()),
    estimatedMonthlyIncome: v.optional(v.number()),
    payFrequency: v.optional(
      v.union(v.literal("monthly"), v.literal("biweekly")),
    ),
    paydays: v.optional(v.array(v.number())),
    allocationNeeds: v.optional(v.number()),
    allocationWants: v.optional(v.number()),
    allocationSavings: v.optional(v.number()),
    savingsGoalEmergency: v.optional(v.number()),
    savingsGoalShortTerm: v.optional(v.number()),
    savingsGoalInvestment: v.optional(v.number()),
    coupleModeEnabled: v.optional(v.boolean()),
    couplePartnerName: v.optional(v.string()),
    coupleMonthlyBudget: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    // If all three allocations are provided, validate they sum to 100
    if (
      args.allocationNeeds !== undefined &&
      args.allocationWants !== undefined &&
      args.allocationSavings !== undefined
    ) {
      const sum =
        args.allocationNeeds + args.allocationWants + args.allocationSavings;
      if (Math.round(sum) !== 100) {
        throw new ConvexError("Allocations must sum to 100%");
      }
    }

    // Build patch object with only defined fields
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(profile._id, patch);
    return null;
  },
});
