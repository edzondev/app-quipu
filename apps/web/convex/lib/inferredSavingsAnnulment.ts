/**
 * Plan how to write down inferred additional savings without moving cash
 * into another envelope. Only touches confirmed surplus rows (not income
 * allocation lines — those must keep balancing the income event).
 */

export type AnnulableSurplusRow = {
	id: string;
	amount: number;
	contributionKind?: "objective" | "additional";
};

export function isInferredAdditionalSurplus(
	row: Pick<AnnulableSurplusRow, "contributionKind">,
): boolean {
	return (row.contributionKind ?? "additional") === "additional";
}

export function planInferredSavingsAnnulment(input: {
	annulCents: number;
	fundCurrentAmount: number;
	surplusRows: ReadonlyArray<AnnulableSurplusRow>;
}): {
	fundAfter: number;
	surplusPatches: Array<{ id: string; amount: number }>;
	surplusDeletes: string[];
} {
	if (!Number.isInteger(input.annulCents) || input.annulCents < 0) {
		throw new Error("annulCents debe ser céntimos enteros no negativos.");
	}
	if (input.annulCents === 0) {
		return {
			fundAfter: input.fundCurrentAmount,
			surplusPatches: [],
			surplusDeletes: [],
		};
	}
	if (input.fundCurrentAmount < input.annulCents) {
		throw new Error("No puedes anular más ahorro inferido del que hay en el Fondo.");
	}

	// LIFO: newest contributions first (caller should pass newest-last or we sort by id insertion order via array order).
	// Reduce inferred additional surplus LIFO when present. Fondo stock always
	// writes down fully; leftover inflation in income allocation lines is left
	// for income edit (those lines must keep balancing the event).
	const additional = input.surplusRows.filter(isInferredAdditionalSurplus);
	let remaining = input.annulCents;
	const surplusPatches: Array<{ id: string; amount: number }> = [];
	const surplusDeletes: string[] = [];

	for (let i = additional.length - 1; i >= 0 && remaining > 0; i -= 1) {
		const row = additional[i];
		if (!row) continue;
		const take = Math.min(remaining, Math.max(0, row.amount));
		if (take <= 0) continue;
		const nextAmount = row.amount - take;
		remaining -= take;
		if (nextAmount <= 0) {
			surplusDeletes.push(row.id);
		} else {
			surplusPatches.push({ id: row.id, amount: nextAmount });
		}
	}

	return {
		fundAfter: input.fundCurrentAmount - input.annulCents,
		surplusPatches,
		surplusDeletes,
	};
}
