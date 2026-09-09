import {
  previewIncomeSplit,
  resolveExtraordinaryPolicy,
  splitIncome,
} from "@/modules/register/allocation";

const WEIGHTS = {
  allocationNeeds: 50,
  allocationWants: 30,
  allocationSavings: 20,
};

describe("splitIncome", () => {
  it("reparte 3500 al 50/30/20 sin residuo", () => {
    expect(splitIncome(350_000, WEIGHTS, "profile_default")).toEqual({
      needs: 175_000,
      wants: 105_000,
      savings: 70_000,
    });
  });

  it("todo al ahorro cuando la política lo pide", () => {
    expect(splitIncome(350_000, WEIGHTS, "all_to_savings")).toEqual({
      needs: 0,
      wants: 0,
      savings: 350_000,
    });
  });
});

describe("previewIncomeSplit", () => {
  it("muestra montos, porcentajes y el aviso de compromisos", () => {
    const preview = previewIncomeSplit({
      amountCents: 350_000,
      weights: WEIGHTS,
      policy: "profile_default",
      commitmentsRemainingCents: 126_500,
    });

    expect(preview.envelopes).toEqual([
      { type: "needs", label: "Necesidades", percent: 50, cents: 175_000 },
      { type: "wants", label: "Gustos", percent: 30, cents: 105_000 },
      { type: "savings", label: "Ahorro", percent: 20, cents: 70_000 },
    ]);
    expect(preview.commitmentsNote).toBe(
      "Tus compromisos del ciclo (S/ 1,265) salen de Necesidades.",
    );
  });

  it("omite el aviso si no hay compromisos pendientes", () => {
    const preview = previewIncomeSplit({
      amountCents: 100_000,
      weights: WEIGHTS,
      policy: "profile_default",
      commitmentsRemainingCents: 0,
    });
    expect(preview.commitmentsNote).toBeNull();
  });
});

describe("resolveExtraordinaryPolicy", () => {
  it("CTS por defecto va todo al ahorro", () => {
    expect(resolveExtraordinaryPolicy("cts", undefined)).toEqual({
      policy: "all_to_savings",
      askEachTime: false,
    });
  });

  it("gratificación de julio usa la distribución del perfil", () => {
    expect(resolveExtraordinaryPolicy("gratification_july", undefined)).toEqual(
      {
        policy: "profile_default",
        askEachTime: false,
      },
    );
  });

  it("si la regla es preguntar, el usuario elige", () => {
    expect(
      resolveExtraordinaryPolicy("corporate_bonus", {
        corporate_bonus: "ask_each_time",
      }),
    ).toEqual({
      policy: "profile_default",
      askEachTime: true,
    });
  });
});
