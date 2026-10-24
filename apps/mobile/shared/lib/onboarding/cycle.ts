import { CYCLE_DAYS_BY_FREQUENCY } from "./daily";
import { PAYDAYS_BY_FREQUENCY } from "./defaults";
import type { PayFrequency } from "./types";

const MONTH_START = PAYDAYS_BY_FREQUENCY.monthly[0];

/** Preview "TU CICLO SERÍA" según frecuencia. */
export function cyclePreview(frequency: PayFrequency): string {
	if (frequency === "variable") return "Sin ciclo fijo";
	const paydays = PAYDAYS_BY_FREQUENCY[frequency];
	const cycleDays = CYCLE_DAYS_BY_FREQUENCY[frequency];
	if (frequency === "monthly") {
		return `Ciclo: ${MONTH_START} – ${cycleDays} de cada mes`;
	}
	if (frequency === "biweekly") {
		return `${MONTH_START} – ${paydays[0]} / ${paydays[0] + 1} – ${paydays[1]} · ${cycleDays} DÍAS`;
	}
	return `${cycleDays} DÍAS`;
}
