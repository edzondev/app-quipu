import {
  formatRemainingLine,
  remainingAfterExpense,
} from "@/modules/register/remaining";

describe("remainingAfterExpense", () => {
  it("42.30 hoy menos 42.00 deja 0.30", () => {
    expect(remainingAfterExpense(4230, 4200)).toBe(30);
  });

  it("puede quedar negativo si el gasto se pasa", () => {
    expect(remainingAfterExpense(4230, 5000)).toBe(-770);
  });
});

describe("formatRemainingLine", () => {
  it("arma la línea del sheet", () => {
    expect(formatRemainingLine(30)).toBe(
      "DESPUÉS DE ESTE GASTO · HOY QUEDA S/ 0.30",
    );
  });

  it("muestra el negativo si se pasa", () => {
    expect(formatRemainingLine(-770)).toBe(
      "DESPUÉS DE ESTE GASTO · HOY QUEDA S/ -7.70",
    );
  });
});
