import type { DashboardSummary } from "@/modules/home/types";
import { toHomeView } from "@/modules/home/use-home-summary";

const ALLOC = { needs: 50, wants: 30, savings: 20 };

function emptySummary(
  overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
  return {
    profile: { name: "Ana", currencyCode: "PEN", plan: "free" },
    cycle: null,
    hero: null,
    envelopes: [],
    commitments: [],
    coach: null,
    movements: [],
    isEarlyCycle: false,
    ...overrides,
  };
}

function activeSummary(
  overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
  return {
    profile: { name: "Ana", currencyCode: "PEN", plan: "free" },
    cycle: {
      id: "c1",
      startDate: Date.parse("2026-08-01T05:00:00.000Z"),
      endDate: Date.parse("2026-08-31T05:00:00.000Z"),
      daysTotal: 30,
      daysRemaining: 15,
      daysElapsed: 15,
      progressPercent: 50,
      needsReview: false,
      unallocatedCents: 0,
    },
    hero: {
      dailyAvailableCents: 4230,
      displayDailyCents: 4230,
      statusBadge: "stable",
      spendableCents: 124000,
      reservedCents: 0,
      unallocatedCents: 0,
    },
    liquidity: {
      spendableCents: 124000,
      reservedCents: 0,
      unallocatedCents: 0,
      savingsParkedInEnvelopeCents: 0,
    },
    envelopes: [
      {
        type: "needs",
        remainingAmount: 61200,
        allocatedAmount: 175000,
        percentRemaining: 35,
      },
      {
        type: "wants",
        remainingAmount: 23100,
        allocatedAmount: 105000,
        percentRemaining: 22,
      },
      {
        type: "savings",
        remainingAmount: 70000,
        allocatedAmount: 70000,
        percentRemaining: 100,
      },
    ],
    commitments: [],
    coach: {
      kind: "tranquil",
      message: "Vas bien. Puedes gastar S/ 42 hoy sin tocar tu ahorro.",
    },
    movements: [
      {
        id: "m1",
        kind: "expense",
        label: "Menú del día",
        envelopeLabel: "Gustos",
        amount: 1500,
        timestamp: Date.parse("2026-08-15T12:00:00.000Z"),
      },
      {
        id: "m2",
        kind: "expense",
        label: "Metropolitano",
        envelopeLabel: "Necesidades",
        amount: 500,
        timestamp: Date.parse("2026-08-15T08:00:00.000Z"),
      },
    ],
    isEarlyCycle: false,
    ...overrides,
  };
}

describe("toHomeView — vacío", () => {
  it("trata null, undefined y cycle null como vacío", () => {
    expect(toHomeView(null, ALLOC).kind).toBe("empty");
    expect(toHomeView(undefined, ALLOC).kind).toBe("empty");
    expect(toHomeView(emptySummary(), ALLOC).kind).toBe("empty");
  });

  it("vacío muestra sin ciclo, título y copy de invitación", () => {
    const view = toHomeView(emptySummary(), ALLOC);
    if (view.kind !== "empty") throw new Error("expected empty");

    expect(view.cycleLabel).toBe("Sin ciclo activo");
    expect(view.title).toBe("Empieza con tu primer ingreso.");
    expect(view.heroHint).toBe(
      "Registra cuánto ganas y Quipu lo reparte en tus tres sobres: Necesidades, Gustos y Ahorro.",
    );
  });
});

describe("toHomeView — ciclo activo", () => {
  it("mapea hero, ciclo, sobres, coach y movimientos", () => {
    const view = toHomeView(activeSummary(), ALLOC);
    if (view.kind !== "active") throw new Error("expected active");

    expect(view.cycleLabel).toBe("Ciclo · Día 15 / 30");
    expect(view.badge.label).toBe("Estable");
    expect(view.dailyCents).toBe(4230);
    expect(view.daysRemainingLabel).toMatch(/15 días · termina 31 ago/);
    expect(view.envelopesTotalCents).toBe(124000);
    expect(view.cycleProgress).toBe(50);
    expect(view.coachMessage).toBe(
      "Vas bien. Puedes gastar S/ 42 hoy sin tocar tu ahorro.",
    );

    expect(view.envelopes[0]).toMatchObject({
      label: "Necesidades",
      cents: 61200,
      suffix: "de 1,750",
      progress: 35,
    });
    expect(view.envelopes[1]).toMatchObject({
      label: "Gustos",
      cents: 23100,
      suffix: "de 1,050",
      progress: 22,
    });
    expect(view.envelopes[2]).toMatchObject({
      label: "Ahorro",
      cents: 70000,
      suffix: "apartado",
      progress: 100,
    });

    expect(view.movements).toEqual([
      {
        id: "m1",
        name: "Menú del día",
        cents: 1500,
        kind: "expense",
        envelopeType: "wants",
      },
      {
        id: "m2",
        name: "Metropolitano",
        cents: 500,
        kind: "expense",
        envelopeType: "needs",
      },
    ]);
  });

  it("cae a vacío si hay ciclo pero no hero", () => {
    const view = toHomeView(activeSummary({ hero: null }), ALLOC);
    expect(view.kind).toBe("empty");
  });

  it("usa bodyCopy del hero cuando viene", () => {
    const view = toHomeView(
      activeSummary({
        hero: {
          dailyAvailableCents: 4230,
          displayDailyCents: 4230,
          bodyCopy: "Tu presupuesto ya está repartido en sobres.",
          statusBadge: "starting",
          spendableCents: 124000,
          reservedCents: 0,
          unallocatedCents: 0,
        },
      }),
      ALLOC,
    );
    if (view.kind !== "active") throw new Error("expected active");
    expect(view.heroHint).toBe("Tu presupuesto ya está repartido en sobres.");
    expect(view.badge.label).toBe("Recién empiezas");
  });
});
