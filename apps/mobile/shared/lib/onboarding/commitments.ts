import type { DraftCommitment } from "./types";

export function isCommitmentValid(commitment: DraftCommitment): boolean {
	return (
		commitment.name.trim().length > 0 &&
		commitment.amountCents > 0 &&
		commitment.dueDay >= 1 &&
		commitment.dueDay <= 31
	);
}

/** Suma de montos de solo los compromisos válidos (pasos 4 y confirmación). */
export function validCommitmentsTotalCents(commitments: DraftCommitment[]): number {
	return commitments.filter(isCommitmentValid).reduce((acc, c) => acc + c.amountCents, 0);
}
