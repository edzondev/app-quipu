import {
  buildDailyImpactLine,
  formatSoles,
} from "@/modules/register/daily-impact-copy";

const money = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

function line(
  overrides?: Partial<Parameters<typeof buildDailyImpactLine>[0]>,
): string {
  return buildDailyImpactLine(
    {
      amountCents: 100_00,
      envelopeType: "wants",
      dailyDeltaCents: -2_52,
      dailyAfterCents: 47_98,
      daysRemainingInCycle: 40,
      ...overrides,
    },
    money,
  );
}

describe("buildDailyImpactLine", () => {
  it("sin cambio de ritmo (sobre ya en negativo) lo dice con calma", () => {
    const text = line({ dailyDeltaCents: 0, dailyAfterCents: 0 });
    expect(text).toContain("S/ 100.00");
    expect(text).toContain("en Gustos");
    expect(text).toContain("Tu ritmo diario no cambia.");
  });

  it("gasto que cabe en el ritmo del día: tono calmado", () => {
    const text = line({
      amountCents: 40_00,
      dailyDeltaCents: -1_02,
      dailyAfterCents: 47_98,
    });
    expect(text).toContain("Cabe en tu ritmo");
    expect(text).toContain("S/ 1.02");
    expect(text).toContain("S/ 47.98");
  });

  it("gasto grande: muestra amortización y días restantes", () => {
    const text = line();
    expect(text).toContain("Tu ritmo diario baja S/ 2.52 al día");
    expect(text).toContain("(quedan 40 días)");
    expect(text).toContain("S/ 47.98");
  });

  it("usa la etiqueta correcta por sobre", () => {
    expect(
      line({ envelopeType: "needs", dailyDeltaCents: 0, dailyAfterCents: 0 }),
    ).toContain("en Necesidades");
  });
});

describe("formatSoles", () => {
  it("formatea céntimos a soles con dos decimales", () => {
    expect(formatSoles(47_98)).toBe("S/ 47.98");
    expect(formatSoles(191_900)).toBe("S/ 1,919.00");
  });
});
