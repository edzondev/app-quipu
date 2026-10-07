import { validateExpenseDraft } from "@/shared/lib/expenses/draft";

const valid = {
  amountRaw: "15.50",
  description: "Menú del día",
  envelopeType: "wants" as const,
};

describe("validateExpenseDraft", () => {
  it("arma el payload de registerExpense en céntimos enteros", () => {
    const result = validateExpenseDraft(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        amount: 1550,
        description: "Menú del día",
        envelopeType: "wants",
      },
    });
  });

  it("recorta la descripción antes de medir el límite", () => {
    const result = validateExpenseDraft({
      ...valid,
      description: "  café  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBe("café");
  });

  it("permite descripción vacía, como el backend", () => {
    const result = validateExpenseDraft({ ...valid, description: "   " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBe("");
  });

  it("rechaza monto cero, inválido o por encima del máximo", () => {
    expect(validateExpenseDraft({ ...valid, amountRaw: "0" })).toMatchObject({
      ok: false,
      error: { field: "amount" },
    });
    expect(validateExpenseDraft({ ...valid, amountRaw: "no" })).toMatchObject({
      ok: false,
      error: { field: "amount" },
    });
    expect(
      validateExpenseDraft({ ...valid, amountRaw: "1000000" }),
    ).toMatchObject({
      ok: false,
      error: { field: "amount" },
    });
  });

  it("rechaza una descripción de más de 120 caracteres", () => {
    const result = validateExpenseDraft({
      ...valid,
      description: "a".repeat(121),
    });
    expect(result).toMatchObject({
      ok: false,
      error: { field: "description" },
    });
  });

  it("nunca acepta ahorro como gasto", () => {
    const result = validateExpenseDraft({
      ...valid,
      envelopeType: "savings",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { field: "envelopeType" },
    });
  });

  it("exige un sobre de necesidades o gustos", () => {
    const result = validateExpenseDraft({ ...valid, envelopeType: null });
    expect(result).toMatchObject({
      ok: false,
      error: { field: "envelopeType" },
    });
  });
});
