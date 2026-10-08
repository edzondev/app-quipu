export type IncomeModel = "fixed" | "variable" | "mixed";
export type PayFrequency = "monthly" | "biweekly" | "weekly";
export type WizardStep = 1 | 2 | 3 | 4 | "confirm" | "success";
export type EnvelopeKey = "needs" | "wants" | "savings";

export type DraftCommitment = {
	id: string;
	name: string;
	amountCents: number;
	dueDay: number;
};

export type OnboardingState = {
	step: WizardStep;
	incomeModel: IncomeModel | null;
	payFrequency: PayFrequency | null;
	/** Referencia visual, NUNCA se persiste (spec §4). */
	referenceIncomeCents: number | null;
	cycleDurationDays: 15 | 30 | undefined;
	mixedFixedAmountCents: number | undefined;
	variableIncomeSources: string[];
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
	commitments: DraftCommitment[];
};

export type OnboardingAction =
	| { type: "UPDATE"; payload: Partial<OnboardingState> }
	| { type: "SET_STEP"; payload: WizardStep }
	| { type: "ADD_COMMITMENT"; payload: DraftCommitment }
	| { type: "REMOVE_COMMITMENT"; payload: string }
	| { type: "UPDATE_COMMITMENT"; payload: DraftCommitment }
	| { type: "RESET" };
