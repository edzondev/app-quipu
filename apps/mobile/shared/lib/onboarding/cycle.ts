import { CYCLE_DAYS_BY_FREQUENCY } from "./daily";
import { PAYDAYS_BY_FREQUENCY } from "./defaults";
import type { PayFrequency } from "./types";

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

/** Preview "TU CICLO SERÍA" según frecuencia. */
export function cyclePreview(frequency: PayFrequency): string {
	if (frequency === "variable") return "Sin ciclo fijo";
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

/** "enero" → "Enero" según el mes actual (título de la confirmación). */
export function currentMonthLabel(): string {
	const name = MONTHS[new Date().getMonth()];
	return name.charAt(0).toUpperCase() + name.slice(1);
}
