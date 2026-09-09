import { buildIncomeEventArgs } from "@/modules/register/income-payload";

const WEIGHTS = {
  allocationNeeds: 50,
  allocationWants: 30,
  allocationSavings: 20,
};

describe("buildIncomeEventArgs", () => {
  it("arma un ingreso habitual con descripción del origen", () => {
    const args = buildIncomeEventArgs({
      amountCents: 350_000,
      kind: "habitual",
      source: "payroll",
      weights: WEIGHTS,
      occurredAt: 1_700_000_000_000,
    });

    expect(args).toEqual({
      amount: 350_000,
      source: "payroll",
      description: "Sueldo",
      occurredAt: 1_700_000_000_000,
      incomeKind: "habitual",
      allocation: {
        reservations: [],
        envelopes: { needs: 175_000, wants: 105_000, savings: 70_000 },
        savingsContributions: [],
        leaveUnallocatedCents: 0,
      },
    });
  });

  it("arma un extraordinario CTS todo al ahorro", () => {
    const args = buildIncomeEventArgs({
      amountCents: 200_000,
      kind: "extraordinary",
      extraordinaryType: "cts",
      weights: WEIGHTS,
      occurredAt: 1_700_000_000_000,
      policy: "all_to_savings",
    });

    expect(args.incomeKind).toBe("extraordinary");
    expect(args.source).toBe("payroll");
    expect(args.description).toBe("");
    expect(args.extraordinaryType).toBe("cts");
    expect(args.distributionPolicy).toBe("all_to_savings");
    expect(args.allocation.envelopes).toEqual({
      needs: 0,
      wants: 0,
      savings: 200_000,
    });
  });

  it("Otro extraordinario pide etiqueta y source other", () => {
    const args = buildIncomeEventArgs({
      amountCents: 50_000,
      kind: "extraordinary",
      extraordinaryType: "custom",
      extraordinaryLabel: "Aguinaldo de la tía",
      weights: WEIGHTS,
      occurredAt: 1_700_000_000_000,
      policy: "profile_default",
    });

    expect(args.source).toBe("other");
    expect(args.extraordinaryLabel).toBe("Aguinaldo de la tía");
  });
});
