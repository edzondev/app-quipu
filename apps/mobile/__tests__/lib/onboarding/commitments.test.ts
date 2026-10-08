import { isCommitmentValid, validCommitmentsTotalCents } from "@/shared/lib/onboarding/commitments";
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
