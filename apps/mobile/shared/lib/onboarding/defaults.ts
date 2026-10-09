import type { IncomeModel, OnboardingState, PayFrequency } from "./types";

export type FixedPayFrequency = Exclude<PayFrequency, "variable">;

function exhaustive<T extends string>() {
	return <const U extends readonly T[]>(values: U & ([T] extends [U[number]] ? unknown : never)) =>
		values;
}

/** Literales de `profiles.createProfile`. Si Convex agrega uno, esto no compila. */
export const INCOME_MODELS = exhaustive<IncomeModel>()(["fixed", "variable", "mixed"]);
export const PAY_FREQUENCIES = exhaustive<PayFrequency>()([
	"monthly",
	"biweekly",
	"weekly",
	"variable",
]);
/** Fijo y Mixto: el schema no acepta payFrequency "variable". */
export const FIXED_FREQUENCIES = exhaustive<FixedPayFrequency>()(["monthly", "biweekly", "weekly"]);

const INCOME_COPY = {
	fixed: {
		title: "Fijo",
		description: "Sueldo en planilla, siempre el mismo monto y la misma fecha.",
	},
	variable: {
		title: "Variable",
		description: "Recibos por honorarios, negocio propio o ingresos por proyecto.",
	},
	mixed: {
		title: "Mixto",
		description: "Un sueldo base más trabajos extra que aparecen de vez en cuando.",
	},
} satisfies Record<IncomeModel, { title: string; description: string }>;

export const INCOME_MODEL_OPTIONS = INCOME_MODELS.map((value) => ({
	value,
	...INCOME_COPY[value],
}));

export const ONBOARDING_DEFAULTS: OnboardingState = {
	step: 1,
	incomeModel: "fixed",
	payFrequency: "monthly",
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
	variable: [1],
};

const FREQ_LABEL = {
	monthly: "Mensual",
	biweekly: "Quincenal",
	weekly: "Semanal",
	variable: "Variable",
} satisfies Record<PayFrequency, string>;

export const FREQ_OPTIONS = PAY_FREQUENCIES.map((value) => ({
	value,
	label: FREQ_LABEL[value],
}));

export const FIXED_FREQ_OPTIONS = FIXED_FREQUENCIES.map((value) => ({
	value,
	label: FREQ_LABEL[value],
}));

export const FREQ_DRIFT_COPY: Record<PayFrequency, string> = {
	monthly:
		"El día de pago es una referencia. Si tu pago real llega antes o después, el ciclo se ajusta a la fecha en que registres tu ingreso.",
	biweekly:
		"Pagado a medio y fin de mes. Si tu pago real llega antes o después (feriados, fines de semana), el ciclo se ajusta a la fecha en que registres tu ingreso.",
	weekly:
		"El día de pago es una referencia. El ciclo se ajusta a la fecha en que registres tu ingreso.",
	variable: "Sin día fijo. Anotas cada ingreso cuando entra.",
};
