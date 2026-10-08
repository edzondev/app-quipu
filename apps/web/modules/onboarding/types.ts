import type { SupportedMarket } from "@/core/constants";

export type IncomeModel = "fixed" | "variable" | "mixed";
export type PayFrequency = "monthly" | "biweekly";
export type CycleDuration = 15 | 30;

export type OnboardingState = {
	currentStep: 1 | 2 | 3;
	incomeModel: IncomeModel | null;
	payFrequency: PayFrequency | null;
	paydays: number[];
	cycleDurationDays: CycleDuration | undefined;
	mixedFixedAmount: number | undefined;
	variableIncomeSources: string[];
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
	marketId: SupportedMarket["id"];
	country: string;
	currencyCode: string;
	currencySymbol: string;
};

export type OnboardingAction =
	| { type: "UPDATE"; payload: Partial<OnboardingState> }
	| { type: "SET_STEP"; payload: OnboardingState["currentStep"] }
	| { type: "RESET" }
	| { type: "HYDRATE"; payload: Partial<OnboardingState> };
