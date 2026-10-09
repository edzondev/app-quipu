import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";

export type CreateProfileArgs = FunctionArgs<typeof api.profiles.createProfile>;
export type StartFirstCycleArgs = FunctionArgs<typeof api.firstCycle.startFirstCycle>;
export type IncomeModel = CreateProfileArgs["incomeModel"];
export type PayFrequency = NonNullable<CreateProfileArgs["payFrequency"]>;
export type CycleField = keyof StartFirstCycleArgs;
export type CycleFieldErrors = Partial<Record<CycleField, string>>;
type BulkArgs = FunctionArgs<typeof api.fixedCommitments.createCommitmentsBulk>;
export type SavedProfileId = BulkArgs["profileId"];
export const WIZARD_STEPS = [1, 2, 3, 4, 5] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];
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
	/** Próximo cobro del primer ciclo, `YYYY-MM-DD` en America/Lima. */
	nextPayDate: string | null;
	cycleFieldErrors: CycleFieldErrors;
	cycleDurationDays: 15 | 30 | undefined;
	mixedFixedAmountCents: number | undefined;
	variableIncomeSources: string[];
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
	commitments: DraftCommitment[];
	savedProfileId: SavedProfileId | null;
	commitmentsSaved: boolean;
};

export type OnboardingAction =
	| { type: "UPDATE"; payload: Partial<OnboardingState> }
	| { type: "SET_STEP"; payload: WizardStep }
	| { type: "ADD_COMMITMENT"; payload: DraftCommitment }
	| { type: "REMOVE_COMMITMENT"; payload: string }
	| { type: "UPDATE_COMMITMENT"; payload: DraftCommitment }
	| { type: "RESET" };
