import { DUE_DAY_ERROR, parseDueDay } from "@/shared/lib/commitments/model";
import type { DraftCommitment } from "./types";

export type CommitmentRowInput = {
	key: string;
	name: string;
	amountRaw: string;
	dueDay: string;
};

export type CommitmentRowField = "name" | "amountRaw" | "dueDay";
export type CommitmentRowErrors = Partial<Record<CommitmentRowField, string>>;

export const COMMITMENT_ROW_ERRORS = {
	nameMissing: "Ponle un nombre.",
	amountMissing: "Indica cuánto pagas.",
	amountZero: "El monto debe ser mayor a cero.",
	dayMissing: "Indica el día del mes en que vence.",
	dayInvalid: DUE_DAY_ERROR,
} as const;

/**
 * Qué está mal en una fila. Mientras la persona escribe (`complete: false`) solo se marca lo
 * que ya es incorrecto (un 32, un monto en 0); al intentar continuar (`complete: true`) también
 * lo que falta. Nada se descarta en silencio: una fila con errores no deja avanzar.
 */
export function commitmentRowErrors(
	row: CommitmentRowInput,
	{ complete }: { complete: boolean },
): CommitmentRowErrors {
	const errors: CommitmentRowErrors = {};
	if (complete && !row.name.trim()) errors.name = COMMITMENT_ROW_ERRORS.nameMissing;

	const digits = row.amountRaw.replace(/\D/g, "");
	if (digits && Number(digits) <= 0) errors.amountRaw = COMMITMENT_ROW_ERRORS.amountZero;
	else if (!digits && complete) errors.amountRaw = COMMITMENT_ROW_ERRORS.amountMissing;

	const day = row.dueDay.trim();
	if (day && parseDueDay(day) == null) errors.dueDay = COMMITMENT_ROW_ERRORS.dayInvalid;
	else if (!day && complete) errors.dueDay = COMMITMENT_ROW_ERRORS.dayMissing;
	return errors;
}

export function isCommitmentRowReady(row: CommitmentRowInput): boolean {
	return Object.keys(commitmentRowErrors(row, { complete: true })).length === 0;
}

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

/**
 * Id de un compromiso nuevo. Solo identifica la fila en el cliente (el servidor no lo usa), así
 * que basta un valor aleatorio sin estado: no depende de cuántas filas hay ni de si el paso se
 * desmontó. Hermes no trae `crypto.randomUUID`.
 */
export function newCommitmentId(): string {
	return `commitment-${Math.random().toString(36).slice(2, 12)}`;
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
