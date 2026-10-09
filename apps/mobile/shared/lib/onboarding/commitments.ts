import { parseDueDay } from "@/shared/lib/commitments/model";
import type { DraftCommitment } from "./types";

export type CommitmentRowInput = {
	key: string;
	name: string;
	amountRaw: string;
	dueDay: string;
};

/** Filas con monto y día válidos. El nombre vacío se descarta: el servidor rechaza el lote. */
export function commitmentsFromRows(rows: CommitmentRowInput[]): DraftCommitment[] {
	const saved: DraftCommitment[] = [];
	for (const row of rows) {
		const name = row.name.trim();
		const digits = row.amountRaw.replace(/\D/g, "");
		const amountCents = digits ? Number(digits) * 100 : 0;
		const dueDay = parseDueDay(row.dueDay);
		if (!name || amountCents <= 0 || dueDay == null) continue;
		saved.push({ id: row.key, name, amountCents, dueDay });
	}
	return saved;
}

export function rowsFromCommitments(commitments: DraftCommitment[]): CommitmentRowInput[] {
	return commitments.map((commitment) => ({
		key: commitment.id,
		name: commitment.name,
		amountRaw: commitment.amountCents > 0 ? String(Math.floor(commitment.amountCents / 100)) : "",
		dueDay: commitment.dueDay >= 1 ? String(commitment.dueDay) : "",
	}));
}

export function isCommitmentValid(commitment: DraftCommitment): boolean {
	return (
		commitment.name.trim().length > 0 &&
		commitment.amountCents > 0 &&
		commitment.dueDay >= 1 &&
		commitment.dueDay <= 31
	);
}

/** Suma de montos de solo los compromisos válidos. */
export function validCommitmentsTotalCents(commitments: DraftCommitment[]): number {
	return commitments.filter(isCommitmentValid).reduce((acc, c) => acc + c.amountCents, 0);
}
