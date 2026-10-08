import { DEFAULT_MARKET } from "@/core/constants";
import type { OnboardingState } from "./types";

export const STEP_LABELS = ["Perfil", "Sistema", "Reparto"] as const;

export const ONBOARDING_DEFAULTS: OnboardingState = {
	currentStep: 1,
	incomeModel: null,
	payFrequency: null,
	paydays: [],
	cycleDurationDays: undefined,
	mixedFixedAmount: undefined,
	variableIncomeSources: [],
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
	marketId: DEFAULT_MARKET.id,
	country: DEFAULT_MARKET.country,
	currencyCode: DEFAULT_MARKET.currencyCode,
	currencySymbol: DEFAULT_MARKET.currencySymbol,
};

export const STORAGE_KEY = "quipu-onboarding-state";

export type IncomeModelOption = {
	value: "fixed" | "variable" | "mixed";
	title: string;
	description: string;
	iconName: "Briefcase" | "TrendingUp" | "Layers";
};

export const INCOME_MODEL_OPTIONS: IncomeModelOption[] = [
	{
		value: "fixed",
		title: "Trabajador dependiente",
		description: "Sueldo fijo en fechas conocidas.",
		iconName: "Briefcase",
	},
	{
		value: "variable",
		title: "Trabajador independiente",
		description: "Ingresos variables por proyecto o venta.",
		iconName: "TrendingUp",
	},
	{
		value: "mixed",
		title: "Ingresos mixtos",
		description: "Una parte fija y otra variable.",
		iconName: "Layers",
	},
];

export const MODEL_DISPLAY_LABELS: Record<string, string> = {
	fixed: "Dependiente",
	variable: "Independiente",
	mixed: "Mixto",
};

export const FREQ_DISPLAY_LABELS: Record<string, string> = {
	monthly: "Mensual",
	biweekly: "Quincenal",
};

export const DAY_PILLS = [15, 30] as number[];
