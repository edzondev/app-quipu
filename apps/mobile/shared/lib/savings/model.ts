import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type SavingsGoalInput = {
	id: string;
	label: string;
	currentAmount: number;
	targetAmount?: number | null;
	progressPercent: number;
};

export type SavingsOverviewInput = {
	profile: { currencyCode: string };
	hasActiveCycle: boolean;
	totalSavedCents: number;
	cycleContributionCents: number;
	emergencyFund: {
		label: string;
		currentAmount: number;
		targetAmount: number;
		progressPercent: number;
		monthsCoveredCopy: string;
	} | null;
	goals: SavingsGoalInput[];
};

export type SavingsModel = {
	currencyCode: string;
	currencySymbol: string;
	hasActiveCycle: boolean;
	totalSavedCents: number;
	cycleContributionCents: number;
	emergencyFund: SavingsOverviewInput["emergencyFund"];
	goals: Array<{
		id: string;
		label: string;
		currentAmount: number;
		targetAmount: number | null;
		progressPercent: number;
	}>;
};

export function mapSavingsOverview(overview: SavingsOverviewInput | null): SavingsModel | null {
	if (!overview) return null;
	const symbol = marketFromCurrencyCode(overview.profile.currencyCode)?.currencySymbol ?? "S/";
	return {
		currencyCode: overview.profile.currencyCode,
		currencySymbol: symbol,
		hasActiveCycle: overview.hasActiveCycle,
		totalSavedCents: overview.totalSavedCents,
		cycleContributionCents: overview.cycleContributionCents,
		emergencyFund: overview.emergencyFund,
		goals: overview.goals.map((goal) => ({
			id: goal.id,
			label: goal.label,
			currentAmount: goal.currentAmount,
			targetAmount: goal.targetAmount ?? null,
			progressPercent: goal.progressPercent,
		})),
	};
}
