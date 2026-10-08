export type ExpenseEnvelopeType = "needs" | "wants";

export type EnvelopeSuggestion = {
	envelopeType: ExpenseEnvelopeType;
	hint: string;
};

/** Montos pequeños (≤ S/ 50) → Gustos. */
const SMALL_EXPENSE_CENTS = 5_000;
/** Montos grandes (≥ S/ 100) → Necesidades. */
const LARGE_EXPENSE_CENTS = 10_000;

export function suggestEnvelope(
	amountCents: number,
	recentEnvelopeTypes: ExpenseEnvelopeType[] = [],
): EnvelopeSuggestion {
	if (amountCents > 0 && amountCents <= SMALL_EXPENSE_CENTS) {
		return {
			envelopeType: "wants",
			hint: "Un café suele salir de aquí.",
		};
	}

	if (amountCents >= LARGE_EXPENSE_CENTS) {
		return {
			envelopeType: "needs",
			hint: "Gastos fijos suelen salir de aquí.",
		};
	}

	if (recentEnvelopeTypes.length > 0) {
		let needsCount = 0;
		let wantsCount = 0;
		for (const type of recentEnvelopeTypes) {
			if (type === "needs") needsCount += 1;
			else wantsCount += 1;
		}

		const envelopeType: ExpenseEnvelopeType = needsCount >= wantsCount ? "needs" : "wants";

		return {
			envelopeType,
			hint: "Coincide con tus gastos recientes.",
		};
	}

	return {
		envelopeType: "wants",
		hint: "Lo habitual es registrarlo en Gustos.",
	};
}

type MovementLike = {
	kind: "expense" | "income";
	envelopeLabel?: string;
};

export function extractRecentExpenseEnvelopes(
	movements: MovementLike[],
	limit = 5,
): ExpenseEnvelopeType[] {
	const result: ExpenseEnvelopeType[] = [];

	for (const movement of movements) {
		if (movement.kind !== "expense") continue;
		if (movement.envelopeLabel === "Necesidades") result.push("needs");
		else if (movement.envelopeLabel === "Gustos") result.push("wants");
		if (result.length >= limit) break;
	}

	return result;
}
