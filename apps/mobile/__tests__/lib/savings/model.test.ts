import { mapSavingsOverview } from "@/shared/lib/savings/model";

describe("mapSavingsOverview", () => {
  it("devuelve null si el query no tiene perfil", () => {
    expect(mapSavingsOverview(null)).toBeNull();
  });

  it("conserva totales, fondo y metas en céntimos", () => {
    const model = mapSavingsOverview({
      profile: { currencyCode: "PEN" },
      hasActiveCycle: true,
      totalSavedCents: 180000,
      cycleContributionCents: 70000,
      emergencyFund: {
        label: "Fondo de emergencia",
        currentAmount: 150000,
        targetAmount: 300000,
        progressPercent: 50,
        monthsCoveredCopy: "1.5 meses",
      },
      goals: [
        {
          id: "g1",
          label: "Viaje",
          currentAmount: 30000,
          targetAmount: 100000,
          progressPercent: 30,
        },
      ],
    });
    expect(model).toMatchObject({
      currencySymbol: "S/",
      totalSavedCents: 180000,
      cycleContributionCents: 70000,
      emergencyFund: { label: "Fondo de emergencia", currentAmount: 150000 },
      goals: [{ id: "g1", label: "Viaje", targetAmount: 100000 }],
    });
  });

  it("deja metas vacías cuando todavía no hay fondo", () => {
    const model = mapSavingsOverview({
      profile: { currencyCode: "USD" },
      hasActiveCycle: false,
      totalSavedCents: 0,
      cycleContributionCents: 0,
      emergencyFund: null,
      goals: [],
    });
    expect(model).toMatchObject({
      currencySymbol: "$",
      emergencyFund: null,
      goals: [],
    });
  });
});
