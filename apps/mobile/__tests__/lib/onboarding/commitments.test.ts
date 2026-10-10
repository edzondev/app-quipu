import {
	type CommitmentRowInput,
	commitmentRowErrors,
	isCommitmentRowReady,
	isCommitmentValid,
	newCommitmentId,
	validCommitmentsTotalCents,
} from "@/shared/lib/onboarding/commitments";
import type { DraftCommitment } from "@/shared/lib/onboarding/types";

function commitment(overrides: Partial<DraftCommitment> = {}): DraftCommitment {
	return {
		id: "c1",
		name: "Agua",
		amountCents: 110000,
		dueDay: 5,
		...overrides,
	};
}

describe("isCommitmentValid", () => {
	it("válido con nombre, monto y día en rango", () => {
		expect(isCommitmentValid(commitment())).toBe(true);
	});

	it("inválido con nombre vacío o solo espacios", () => {
		expect(isCommitmentValid(commitment({ name: "" }))).toBe(false);
		expect(isCommitmentValid(commitment({ name: "   " }))).toBe(false);
	});

	it("inválido con monto 0", () => {
		expect(isCommitmentValid(commitment({ amountCents: 0 }))).toBe(false);
	});

	it("inválido con día fuera de 1..31", () => {
		expect(isCommitmentValid(commitment({ dueDay: 0 }))).toBe(false);
		expect(isCommitmentValid(commitment({ dueDay: 32 }))).toBe(false);
	});
});

describe("validCommitmentsTotalCents", () => {
	it("suma solo los compromisos válidos", () => {
		expect(
			validCommitmentsTotalCents([
				commitment({ id: "a", amountCents: 110000, dueDay: 5 }),
				commitment({ id: "b", amountCents: 16500, dueDay: 0 }),
				commitment({ id: "c", amountCents: 0 }),
			]),
		).toBe(110000);
	});

	it("lista vacía suma 0", () => {
		expect(validCommitmentsTotalCents([])).toBe(0);
	});
});

function row(overrides: Partial<CommitmentRowInput> = {}): CommitmentRowInput {
	return { key: "r1", name: "Agua", amountRaw: "1100", dueDay: "5", ...overrides };
}

describe("commitmentRowErrors", () => {
	it("una fila completa y en rango no tiene errores", () => {
		expect(commitmentRowErrors(row(), { complete: true })).toEqual({});
		expect(isCommitmentRowReady(row())).toBe(true);
	});

	it("mientras se escribe solo marca lo incorrecto, no lo que falta", () => {
		const draft = row({ amountRaw: "", dueDay: "" });
		expect(commitmentRowErrors(draft, { complete: false })).toEqual({});
		expect(commitmentRowErrors(row({ dueDay: "32" }), { complete: false })).toEqual({
			dueDay: "El día de vencimiento va del 1 al 31.",
		});
		expect(commitmentRowErrors(row({ amountRaw: "0" }), { complete: false })).toEqual({
			amountRaw: "El monto debe ser mayor a cero.",
		});
	});

	it("al intentar continuar también pide lo que falta", () => {
		expect(
			commitmentRowErrors(row({ name: " ", amountRaw: "", dueDay: "" }), { complete: true }),
		).toEqual({
			name: "Ponle un nombre.",
			amountRaw: "Indica cuánto pagas.",
			dueDay: "Indica el día del mes en que vence.",
		});
		expect(isCommitmentRowReady(row({ dueDay: "" }))).toBe(false);
	});

	it("acepta 1 y 31, rechaza 0 y 32", () => {
		for (const day of ["1", "31"]) {
			expect(commitmentRowErrors(row({ dueDay: day }), { complete: true })).toEqual({});
		}
		for (const day of ["0", "32", "99"]) {
			expect(commitmentRowErrors(row({ dueDay: day }), { complete: true }).dueDay).toBeDefined();
		}
	});
});

describe("newCommitmentId", () => {
	it("nunca repite un id", () => {
		const ids = Array.from({ length: 500 }, () => newCommitmentId());
		expect(new Set(ids).size).toBe(ids.length);
	});
});
