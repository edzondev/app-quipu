import type { Id } from "@/convex/_generated/dataModel";

export const profileId = "k57f4a8b0e0a0a0a0a0a0a0a" as Id<"profiles">;

export const baseProfile = {
  _id: profileId,
  userId: "user_123",
  name: "Test User",
  country: "PE",
  currencyCode: "PEN",
  currencySymbol: "S/",
  currencyName: "Sol Peruano",
  currencyLocale: "es-PE",
  payFrequency: "monthly" as const,
  paydays: [15],
  monthlyIncome: 3000,
  allocationNeeds: 50,
  allocationWants: 30,
  allocationSavings: 20,
  savingsGoalEmergency: 9000,
  savingsGoalInvestment: 7200,
  coupleModeEnabled: false,
  couplePartnerName: "",
  coupleMonthlyBudget: 0,
  onboardingComplete: true,
  plan: "free" as const,
};

export function dependentProfile(overrides: Record<string, unknown> = {}) {
  return {
    ...baseProfile,
    workerType: "dependent" as const,
    ...overrides,
  };
}

export function independentProfile(overrides: Record<string, unknown> = {}) {
  return {
    ...baseProfile,
    workerType: "independent" as const,
    envelopeNeeds: 0,
    envelopeWants: 0,
    envelopeSavings: 0,
    ...overrides,
  };
}

export function expense(
  amount: number,
  envelope: "needs" | "wants" | "juntos",
  date = "2026-06-15",
) {
  return {
    _id: `exp_${Math.random().toString(36).slice(2)}` as Id<"expenses">,
    profileId,
    amount,
    envelope,
    date,
  };
}

export function commitment(
  amount: number,
  envelope: "needs" | "wants",
  name = "Commitment",
) {
  return {
    _id: `cmt_${Math.random().toString(36).slice(2)}` as Id<"fixedCommitments">,
    profileId,
    name,
    amount,
    envelope,
  };
}

export function savingsSubEnvelope(
  subEnvelopeId: string,
  currentAmount: number,
  goalAmount: number,
  progress = 0,
) {
  return {
    _id: `sse_${subEnvelopeId}_${Math.random().toString(36).slice(2)}` as Id<"savingsSubEnvelopes">,
    profileId,
    subEnvelopeId,
    label: subEnvelopeId,
    icon: "💰",
    currentAmount,
    goalAmount,
    progress,
  };
}

export function savingsGoal(
  name: string,
  targetAmount: number,
  currentAmount: number,
  monthlyRequired: number,
) {
  return {
    _id: `sg_${Math.random().toString(36).slice(2)}` as Id<"savingsGoals">,
    profileId,
    name,
    emoji: "🎯",
    targetAmount,
    currentAmount,
    deadline: "2027-06-01",
    monthlyRequired,
  };
}
