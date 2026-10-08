export type CrisisCommitmentSlice = {
	id: string;
	name: string;
	amount: number;
	remaining: number;
	envelope: "needs" | "wants";
	dueDay: number;
};

export type CrisisCoachOption = {
	id: string;
	title: string;
	subtitle: string;
	commitmentId?: string;
	transferTotal?: number;
};

export function pickPostponeCandidate(
	commitments: CrisisCommitmentSlice[],
): CrisisCommitmentSlice | null {
	const uncovered = commitments.filter((commitment) => commitment.remaining > 0);
	if (uncovered.length === 0) return null;

	const wants = uncovered
		.filter((commitment) => commitment.envelope === "wants")
		.sort((a, b) => a.remaining - b.remaining);

	const [firstWant] = wants;
	if (firstWant) return firstWant;

	const needs = uncovered
		.filter((commitment) => commitment.envelope === "needs")
		.sort((a, b) => a.remaining - b.remaining);

	return needs[0] ?? null;
}

export function computeCoverFromSavingsSplit(
	uncoveredByEnvelope: { needs: number; wants: number },
	savingsRemaining: number,
): { needs: number; wants: number; total: number } {
	const totalUncovered = uncoveredByEnvelope.needs + uncoveredByEnvelope.wants;
	const total = Math.min(Math.max(savingsRemaining, 0), totalUncovered);

	if (total <= 0) {
		return { needs: 0, wants: 0, total: 0 };
	}

	if (totalUncovered <= 0) {
		return { needs: 0, wants: 0, total: 0 };
	}

	const needs = Math.round((uncoveredByEnvelope.needs / totalUncovered) * total);
	const wants = total - needs;

	return { needs, wants, total };
}

function formatAmount(cents: number, currencySymbol: string): string {
	return `${currencySymbol} ${(cents / 100).toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

export function buildCoverFromSavingsOption(
	transferTotal: number,
	currencySymbol = "S/",
): CrisisCoachOption {
	return {
		id: "cover_from_savings",
		title: `Tomar ${formatAmount(transferTotal, currencySymbol)} del Ahorro del ciclo`,
		subtitle: "No toca tu Fondo de emergencia",
		transferTotal,
	};
}

export function buildPostponeOption(
	commitment: CrisisCommitmentSlice,
	currencySymbol = "S/",
): CrisisCoachOption {
	return {
		id: `postpone_${commitment.id}`,
		title: `Posponer ${commitment.name} al próximo ciclo`,
		subtitle: `Libera ${formatAmount(commitment.remaining, currencySymbol)}`,
		commitmentId: commitment.id,
	};
}

export function buildCrisisCoachOptions(params: {
	commitments: CrisisCommitmentSlice[];
	savingsRemaining: number;
	currencySymbol?: string;
}): CrisisCoachOption[] {
	const { commitments, savingsRemaining, currencySymbol = "S/" } = params;

	const uncoveredByEnvelope = commitments.reduce(
		(acc, commitment) => {
			if (commitment.remaining <= 0) return acc;
			acc[commitment.envelope] += commitment.remaining;
			return acc;
		},
		{ needs: 0, wants: 0 },
	);

	const split = computeCoverFromSavingsSplit(uncoveredByEnvelope, savingsRemaining);
	const options: CrisisCoachOption[] = [];

	if (split.total > 0) {
		options.push(buildCoverFromSavingsOption(split.total, currencySymbol));
	}

	const postponeCandidate = pickPostponeCandidate(commitments);
	if (postponeCandidate) {
		options.push(buildPostponeOption(postponeCandidate, currencySymbol));
	}

	return options;
}
