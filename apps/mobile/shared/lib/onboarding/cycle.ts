import { CYCLE_DAYS_BY_FREQUENCY } from "./daily";
import { PAYDAYS_BY_FREQUENCY } from "./defaults";
import type { OnboardingState, PayFrequency } from "./types";

const MONTH_START = PAYDAYS_BY_FREQUENCY.monthly[0];

const MONTHS = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
];

/** Copia del día de pago según frecuencia (paso 2). */
export function paydayText(frequency: PayFrequency): string {
	const paydays = PAYDAYS_BY_FREQUENCY[frequency];
	if (frequency === "weekly") {
		return `Cada ${CYCLE_DAYS_BY_FREQUENCY.weekly} días`;
	}
	return `El ${paydays.join(" y ")} de cada mes`;
}

/** Preview "TU CICLO SERÍA" según frecuencia (paso 2). */
export function cyclePreview(frequency: PayFrequency): string {
	const paydays = PAYDAYS_BY_FREQUENCY[frequency];
	const cycleDays = CYCLE_DAYS_BY_FREQUENCY[frequency];
	if (frequency === "monthly") {
		return `${MONTH_START} – ${cycleDays} de cada mes · ${cycleDays} DÍAS`;
	}
	if (frequency === "biweekly") {
		return `${MONTH_START} – ${paydays[0]} / ${paydays[0] + 1} – ${paydays[1]} · ${cycleDays} DÍAS`;
	}
	return `${cycleDays} DÍAS`;
}

type CycleDaysInput = {
	incomeModel: OnboardingState["incomeModel"];
	payFrequency?: OnboardingState["payFrequency"];
	cycleDurationDays?: OnboardingState["cycleDurationDays"];
};

/**
 * Días del ciclo según el modelo de ingreso elegido, con fallback a 30
 * mientras el usuario no complete el paso (usado por la confirmación).
 */
export function cycleDaysForModel(state: CycleDaysInput): number {
	if (state.incomeModel === "variable") {
		return state.cycleDurationDays ?? 30;
	}
	return state.payFrequency ? CYCLE_DAYS_BY_FREQUENCY[state.payFrequency] : 30;
}

/** "enero" → "Enero" según el mes actual (título de la confirmación). */
export function currentMonthLabel(): string {
	const name = MONTHS[new Date().getMonth()];
	return name.charAt(0).toUpperCase() + name.slice(1);
}
