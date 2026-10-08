import {
	detailRemainingLabel,
	formatExpenseWhen,
	frequentChipLabel,
	remainingAfterExpense,
	sheetRemainingLabel,
} from "@/shared/lib/expenses/present";

const AUGUST_15 = Date.UTC(2026, 7, 15, 17, 0, 0);

describe("presentación del gasto", () => {
	it("resta solo el delta del gasto al saldo de hoy", () => {
		expect(remainingAfterExpense(4230, 4200)).toBe(30);
		expect(remainingAfterExpense(4230, 1000, 4200)).toBe(7430);
	});

	it("arma las líneas de saldo del sheet y del detalle", () => {
		expect(sheetRemainingLabel(30, "S/")).toBe("DESPUÉS DE ESTE GASTO · HOY QUEDA S/ 0.30");
		expect(detailRemainingLabel(30, "S/")).toBe("HOY QUEDARÍA S/ 0.30");
	});

	it("etiqueta frecuentes en soles", () => {
		expect(frequentChipLabel("Café", 800)).toBe("Café · 8");
		expect(frequentChipLabel("Menú", 1550)).toBe("Menú · 15.50");
	});

	it("marca la fecha de hoy en Lima", () => {
		expect(formatExpenseWhen(AUGUST_15, AUGUST_15)).toMatch(/^Hoy · 15 /);
		expect(formatExpenseWhen(AUGUST_15, Date.UTC(2026, 7, 16, 17, 0, 0))).toMatch(/^15 /);
	});
});
