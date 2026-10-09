export const CYCLE_DAYS_BY_FREQUENCY = {
	monthly: 30,
	biweekly: 15,
	weekly: 7,
	variable15: 15,
	variable30: 30,
} as const;

export function formatSoles(cents: number, symbol = "S/"): string {
	const soles = cents / 100;
	const hasCents = cents % 100 !== 0;
	const formatted = soles.toLocaleString("es-PE", {
		minimumFractionDigits: hasCents ? 2 : 0,
		maximumFractionDigits: 2,
	});
	return `${symbol} ${formatted}`;
}

/** Formatea dígitos de soles enteros con separador de miles ("3500" → "3,500"). */
export function formatIntegerEs(digits: string): string {
	if (!digits) return "";
	return Number(digits).toLocaleString("es-PE");
}
