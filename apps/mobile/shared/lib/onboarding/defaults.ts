import type { IncomeModel, OnboardingState, PayFrequency } from "./types";

export const INCOME_MODEL_OPTIONS: {
	value: IncomeModel;
	title: string;
	description: string;
}[] = [
	{
		value: "fixed",
		title: "Fijo",
		description: "Sueldo en planilla, siempre el mismo monto y la misma fecha.",
	},
	{
		value: "variable",
		title: "Variable",
		description: "Recibos por honorarios, negocio propio o ingresos por proyecto.",
	},
	{
		value: "mixed",
		title: "Mixto",
		description: "Un sueldo base más trabajos extra que aparecen de vez en cuando.",
	},
];

export const ONBOARDING_DEFAULTS: OnboardingState = {
	step: 1,
	incomeModel: null,
	payFrequency: null,
	referenceIncomeCents: null,
	cycleDurationDays: undefined,
	mixedFixedAmountCents: undefined,
	variableIncomeSources: [],
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
	commitments: [],
};

export const PAYDAYS_BY_FREQUENCY: Record<PayFrequency, number[]> = {
	monthly: [1],
	biweekly: [15, 30],
	weekly: [1],
};

export const FREQ_OPTIONS: { value: PayFrequency; label: string }[] = [
	{ value: "monthly", label: "Mensual" },
	{ value: "biweekly", label: "Quincenal" },
	{ value: "weekly", label: "Semanal" },
];

export const FREQ_DRIFT_COPY: Record<PayFrequency, string> = {
	monthly:
		"El día de pago es una referencia. Si tu pago real llega antes o después, el ciclo se ajusta a la fecha en que registres tu ingreso.",
	biweekly:
		"Pagado a medio y fin de mes. Si tu pago real llega antes o después (feriados, fines de semana), el ciclo se ajusta a la fecha en que registres tu ingreso.",
	weekly:
		"El día de pago es una referencia. El ciclo se ajusta a la fecha en que registres tu ingreso.",
};
