import {
  editableFromRecentExpense,
  mapMovementRows,
  readRecentExpenses,
} from "@/shared/lib/movements/model";

describe("mapMovementRows", () => {
  it("marca gastos de necesidades y gustos como editables", () => {
    const [row] = mapMovementRows([
      {
        id: "exp1",
        kind: "expense",
        label: "Metropolitano",
        amount: 500,
        envelopeLabel: "Necesidades",
        envelopeType: "needs",
      },
    ]);
    expect(row).toMatchObject({
      id: "exp1",
      direction: "out",
      tone: "needs",
      amountCents: 500,
      editable: {
        id: "exp1",
        amountCents: 500,
        description: "Metropolitano",
        envelopeType: "needs",
      },
    });
  });

  it("reconoce un gasto de ahorro por la etiqueta aunque no sea editable", () => {
    const [row] = mapMovementRows([
      {
        id: "exp3",
        kind: "expense",
        label: "Fondo",
        amount: 1000,
        envelopeLabel: "Ahorro",
      },
    ]);
    expect(row?.tone).toBe("savings");
    expect(row?.editable).toBeNull();
  });

  it("no permite editar un gasto colgado de ahorro", () => {
    const [row] = mapMovementRows([
      {
        id: "exp2",
        kind: "expense",
        label: "Fondo",
        amount: 1000,
        envelopeType: "savings",
      },
    ]);
    expect(row?.editable).toBeNull();
    expect(row?.tone).toBe("savings");
  });

  it("trata ingresos y aportes como entradas", () => {
    const rows = mapMovementRows([
      { id: "in1", kind: "income", label: "Sueldo", amount: 100 },
      { id: "c1", kind: "contribution", label: "Aporte", amount: 50 },
    ]);
    expect(rows.map((row) => row.direction)).toEqual(["in", "in"]);
    expect(rows.every((row) => row.editable === null)).toBe(true);
    expect(rows[0]?.tone).toBe("income");
  });
});

describe("editableFromRecentExpense", () => {
  it("convierte un gasto reciente de gustos en borrador editable", () => {
    expect(
      editableFromRecentExpense({
        _id: "exp1",
        amount: 1550,
        description: "Café",
        envelopeType: "wants",
      }),
    ).toEqual({
      id: "exp1",
      amountCents: 1550,
      description: "Café",
      envelopeType: "wants",
    });
  });

  it("lee gastos recientes y descarta filas incompletas", () => {
    expect(
      readRecentExpenses([
        {
          _id: "exp1",
          amount: 500,
          description: "Bus",
          timestamp: 10,
          envelopeType: "needs",
        },
        { amount: 100 },
        null,
      ]),
    ).toEqual([
      {
        _id: "exp1",
        amount: 500,
        description: "Bus",
        timestamp: 10,
        envelopeType: "needs",
      },
    ]);
    expect(readRecentExpenses(null)).toEqual([]);
  });

  it("ignora gastos sin sobre de necesidades o gustos", () => {
    expect(
      editableFromRecentExpense({
        _id: "exp2",
        amount: 100,
        description: "Ahorro",
        envelopeType: "savings",
      }),
    ).toBeNull();
    expect(
      editableFromRecentExpense({
        _id: "exp3",
        amount: 100,
        description: "Sin sobre",
      }),
    ).toBeNull();
  });
});
