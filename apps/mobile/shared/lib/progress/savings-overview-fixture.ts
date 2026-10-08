import type { SavingsOverview } from "@/shared/lib/savings/model";

/** Objeto completo del validator de savings.getOverview. */
export const savingsOverview = {
	profile: { name: "Ana", currencyCode: "PEN" },
	hasActiveCycle: true,
	totalSavedCents: 432000,
	cycleContributionCents: 0,
	emergencyFund: null,
	goals: [],
	canCreateGoal: false,
	assignPlan: null,
} satisfies NonNullable<SavingsOverview>;
