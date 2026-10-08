/**
 * Keypad monetario para registro rápido de gastos.
 * Trabaja en céntimos enteros; cada dígito desplaza a la izquierda (estilo POS).
 */

export const KEYPAD_MAX_CENTS = 99_999_999;

export function appendKeypadDigit(currentCents: number, digit: number): number {
	if (!Number.isInteger(currentCents) || currentCents < 0) return 0;
	if (!Number.isInteger(digit) || digit < 0 || digit > 9) return currentCents;

	const next = currentCents * 10 + digit;
	return next > KEYPAD_MAX_CENTS ? currentCents : next;
}

export function backspaceKeypad(currentCents: number): number {
	if (!Number.isInteger(currentCents) || currentCents <= 0) return 0;
	return Math.floor(currentCents / 10);
}

/**
 * Formato canon Bloque 4: S/ XX.XX sin separador de miles.
 */
export function formatKeypadDisplay(cents: number, currencySymbol = "S/"): string {
	const safe = Number.isInteger(cents) && cents >= 0 ? cents : 0;
	const major = Math.floor(safe / 100);
	const minor = safe % 100;
	return `${currencySymbol} ${major}.${minor.toString().padStart(2, "0")}`;
}

export function isKeypadAmountValid(cents: number): boolean {
	return Number.isInteger(cents) && cents > 0;
}

export function formatElapsedSeconds(startedAtMs: number, nowMs: number): number {
	const elapsed = Math.max(0, nowMs - startedAtMs);
	return Math.max(1, Math.round(elapsed / 1000));
}
