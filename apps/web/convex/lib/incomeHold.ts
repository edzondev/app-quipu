/**
 * P3-4: Income hold helpers.
 *
 * Held cents are reserved before the 50/30/20 distribution:
 *   distributable = amount - heldCents
 *   distributionApplied = policy(distributable)
 *   totalIncomeReceived += amount  (gross, unchanged)
 */

/**
 * Returns the distributable amount after subtracting the hold.
 * heldCents is clamped to [0, amount].
 */
export function computeDistributableCents(amount: number, heldCents: number): number {
	const held = Math.max(0, Math.min(heldCents, amount));
	return amount - held;
}

/**
 * Suggests how many cents to hold based on the sum of uncovered commitment
 * remainders. Returns min(amount, uncoveredRemaining), floored to zero.
 */
export function suggestHeldCents(amount: number, uncoveredCommitmentsRemainingSum: number): number {
	return Math.min(amount, Math.max(0, Math.floor(uncoveredCommitmentsRemainingSum)));
}

/**
 * Validates that heldCents is a valid hold value for the given amount.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateHeldCents(amount: number, heldCents: number): string | null {
	if (!Number.isInteger(heldCents)) {
		return "El monto apartado debe ser un entero de céntimos.";
	}
	if (heldCents < 0) {
		return "El monto apartado no puede ser negativo.";
	}
	if (heldCents > amount) {
		return "El monto apartado no puede superar el ingreso.";
	}
	return null;
}
