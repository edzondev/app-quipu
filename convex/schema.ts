import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const payFrequency = v.union(v.literal("monthly"), v.literal("biweekly"));
const envelopeType = v.union(v.literal("needs"), v.literal("wants"));
const expenseEnvelope = v.union(
  v.literal("needs"),
  v.literal("wants"),
  v.literal("juntos"),
);
const allocationStrategy = v.union(
  v.literal("savings"),
  v.literal("distribute"),
  v.literal("custom"),
);
const coachMessageType = v.union(
  v.literal("alert"),
  v.literal("celebration"),
  v.literal("encouragement"),
  v.literal("warning"),
);
const achievementCategory = v.union(
  v.literal("savings"),
  v.literal("streak"),
  v.literal("milestone"),
);
const registeredBy = v.union(v.literal("user"), v.literal("partner"));
const planType = v.union(v.literal("free"), v.literal("premium"));
const workerType = v.union(v.literal("dependent"), v.literal("independent"));

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    country: v.string(),
    currencyCode: v.string(),
    currencySymbol: v.string(),
    currencyName: v.string(),
    currencyLocale: v.string(),
    workerType: workerType,
    payFrequency: v.optional(payFrequency),
    paydays: v.optional(v.array(v.number())),
    monthlyIncome: v.number(),
    estimatedMonthlyIncome: v.optional(v.number()),
    initialRemainingBudget: v.optional(v.number()),
    initialBudgetMonth: v.optional(v.string()),
    envelopeNeeds: v.optional(v.number()),
    envelopeWants: v.optional(v.number()),
    envelopeSavings: v.optional(v.number()),
    allocationNeeds: v.number(),
    allocationWants: v.number(),
    allocationSavings: v.number(),
    savingsGoalEmergency: v.number(),
    //savingsGoalShortTerm: v.number(),
    savingsGoalInvestment: v.number(),
    coupleModeEnabled: v.boolean(),
    couplePartnerName: v.string(),
    coupleMonthlyBudget: v.number(),
    onboardingComplete: v.boolean(),
    plan: planType,
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    planActivatedAt: v.optional(v.number()),
    lastPaydayProcessedAt: v.optional(v.string()),
    rescuePausedSavingsMonth: v.optional(v.string()),
    rescueAppliedAt: v.optional(v.number()),
    rescueActionId: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  fixedCommitments: defineTable({
    profileId: v.id("profiles"),
    name: v.string(),
    amount: v.number(),
    envelope: envelopeType,
  }).index("by_profileId", ["profileId"]),

  specialIncomes: defineTable({
    profileId: v.id("profiles"),
    typeId: v.string(),
    amount: v.number(),
    month: v.optional(v.number()),
    allocationStrategy: allocationStrategy,
    customAllocNeeds: v.optional(v.number()),
    customAllocWants: v.optional(v.number()),
    customAllocSavings: v.optional(v.number()),
  }).index("by_profileId", ["profileId"]),

  expenses: defineTable({
    profileId: v.id("profiles"),
    amount: v.number(),
    description: v.optional(v.string()),
    envelope: expenseEnvelope,
    date: v.string(),
    registeredBy: v.optional(registeredBy),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_date", ["profileId", "date"])
    .index("by_profileId_envelope", ["profileId", "envelope"]),

  savingsSubEnvelopes: defineTable({
    profileId: v.id("profiles"),
    subEnvelopeId: v.string(),
    label: v.string(),
    icon: v.string(),
    currentAmount: v.number(),
    goalAmount: v.number(),
    progress: v.number(),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_subEnvelopeId", ["profileId", "subEnvelopeId"]),

  savingsGoals: defineTable({
    profileId: v.id("profiles"),
    name: v.string(),
    emoji: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.string(),
    monthlyRequired: v.number(),
  }).index("by_profileId", ["profileId"]),

  coachMessages: defineTable({
    profileId: v.id("profiles"),
    type: coachMessageType,
    message: v.string(),
    date: v.string(),
    read: v.boolean(),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_read", ["profileId", "read"]),

  achievements: defineTable({
    profileId: v.id("profiles"),
    achievementId: v.string(),
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    category: achievementCategory,
    unlockedAt: v.optional(v.string()),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_achievementId", ["profileId", "achievementId"]),

  streaks: defineTable({
    profileId: v.id("profiles"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastComplianceDate: v.optional(v.string()),
  }).index("by_profileId", ["profileId"]),

  streakMonthlyHistory: defineTable({
    profileId: v.id("profiles"),
    month: v.string(),
    compliant: v.boolean(),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_month", ["profileId", "month"]),
});
