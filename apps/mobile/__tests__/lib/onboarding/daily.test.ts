import { estimateDailyAvailable } from "@/shared/lib/onboarding/daily";

describe("estimateDailyAvailable", () => {
  // Contrato: floor a céntimo. (350000 - 126500 - 70000) / 30 = 5116.67 → 5116
  it("3500 soles, 1265 de compromisos, ahorro 20%, ciclo 30 → 5116", () => {
    const r = estimateDailyAvailable({
      referenceIncomeCents: 350000,
      commitmentsTotalCents: 126500,
      allocationNeeds: 50,
      allocationWants: 30,
      allocationSavings: 20,
      cycleDays: 30,
    });
    expect(r).toBe(5116);
  });

  it("retorna null sin ingreso de referencia", () => {
    expect(
      estimateDailyAvailable({
        referenceIncomeCents: 0,
        commitmentsTotalCents: 0,
        allocationNeeds: 50,
        allocationWants: 30,
        allocationSavings: 20,
        cycleDays: 30,
      }),
    ).toBeNull();
  });

  it("retorna null con cicloDays inválido", () => {
    expect(
      estimateDailyAvailable({
        referenceIncomeCents: 350000,
        commitmentsTotalCents: 0,
        allocationNeeds: 50,
        allocationWants: 30,
        allocationSavings: 20,
        cycleDays: 0,
      }),
    ).toBeNull();
  });

  it("retorna 0 si lo gastable es negativo", () => {
    expect(
      estimateDailyAvailable({
        referenceIncomeCents: 100000,
        commitmentsTotalCents: 200000,
        allocationNeeds: 50,
        allocationWants: 30,
        allocationSavings: 20,
        cycleDays: 30,
      }),
    ).toBe(0);
  });

  it("hace floor del resultado diario", () => {
    // (100000 - 0 - 0) / 7 = 14285.71 → 14285
    expect(
      estimateDailyAvailable({
        referenceIncomeCents: 100000,
        commitmentsTotalCents: 0,
        allocationNeeds: 50,
        allocationWants: 30,
        allocationSavings: 0,
        cycleDays: 7,
      }),
    ).toBe(14285);
  });
});
