import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";

const AUGUST_START = Date.UTC(2026, 7, 1, 5, 0, 0);
const NOW = Date.UTC(2026, 7, 15, 17, 0, 0);
const TODAY_MOVE = Date.UTC(2026, 7, 15, 15, 0, 0);
const YESTERDAY_MOVE = Date.UTC(2026, 7, 14, 15, 0, 0);

function summary(
  overrides: Partial<Parameters<typeof mapDashboardHome>[0]> = {},
) {
  return {
    profile: { name: "Edzon", currencyCode: "PEN" },
    cycle: {
      startDate: AUGUST_START,
      daysTotal: 30,
      daysRemaining: 15,
      daysElapsed: 15,
      progressPercent: 50,
    },
    hero: {
      displayDailyCents: 4230,
      statusBadge: "stable" as const,
      bodyCopy: undefined,
    },
    envelopes: [
      {
        type: "needs" as const,
        allocatedAmount: 175000,
        remainingAmount: 61200,
        percentRemaining: 35,
      },
      {
        type: "wants" as const,
        allocatedAmount: 105000,
        remainingAmount: 23100,
        percentRemaining: 22,
      },
      {
        type: "savings" as const,
        allocatedAmount: 70000,
        remainingAmount: 70000,
        percentRemaining: 100,
      },
    ],
    coach: { message: "Vas bien." },
    movements: [
      {
        id: "e1",
        kind: "expense" as const,
        label: "Menú del día",
        amount: 1500,
        timestamp: TODAY_MOVE,
        envelopeLabel: "Gustos",
      },
      {
        id: "e0",
        kind: "expense" as const,
        label: "Ayer",
        amount: 500,
        timestamp: YESTERDAY_MOVE,
        envelopeLabel: "Necesidades",
      },
    ],
    ...overrides,
  };
}

describe("mapDashboardHome", () => {
  it("devuelve null si no hay ciclo activo", () => {
    expect(
      mapDashboardHome(summary({ cycle: null, hero: null }), NOW),
    ).toBeNull();
  });

  it("mapea el héroe, el ciclo y el coach sin datos ficticios", () => {
    const home = mapDashboardHome(summary(), NOW);
    expect(home).toMatchObject({
      cycleLabel: "Ciclo agosto",
      cycleDay: 15,
      cycleTotal: 30,
      daysLeft: 15,
      cycleProgress: 50,
      badgeLabel: "Estable",
      badgeTone: "stable",
      dailyCents: 4230,
      heroSubtitle: "Sin tocar tus compromisos ni tu ahorro.",
      coachMessage: "Vas bien.",
      currencySymbol: "S/",
    });
  });

  it("traduce los otros estados del ciclo", () => {
    expect(
      mapDashboardHome(
        summary({
          hero: {
            displayDailyCents: 0,
            statusBadge: "risk",
          },
        }),
        NOW,
      )?.badgeLabel,
    ).toBe("En riesgo");
    expect(
      mapDashboardHome(
        summary({
          hero: {
            displayDailyCents: 0,
            statusBadge: "starting",
            bodyCopy: "Registra tu primer gasto.",
          },
        }),
        NOW,
      ),
    ).toMatchObject({
      badgeLabel: "Recién empiezas",
      heroSubtitle: "Registra tu primer gasto.",
    });
  });

  it("muestra gastado contra asignado y deja el ahorro como apartado", () => {
    const home = mapDashboardHome(summary(), NOW);
    expect(home?.envelopes).toEqual([
      {
        label: "Necesidades",
        spentCents: 113800,
        totalCents: 175000,
        progress: 65,
        tone: "needs",
        suffix: "de 1,750",
      },
      {
        label: "Gustos",
        spentCents: 81900,
        totalCents: 105000,
        progress: 78,
        tone: "wants",
        suffix: "de 1,050",
      },
      {
        label: "Ahorro",
        spentCents: 70000,
        totalCents: 70000,
        progress: 100,
        tone: "savings",
        suffix: "apartado",
      },
    ]);
    expect(home?.envelopesBalanceCents).toBe(154300);
  });

  it("acota la barra si el sobre quedó en negativo", () => {
    const home = mapDashboardHome(
      summary({
        envelopes: [
          {
            type: "needs",
            allocatedAmount: 1000,
            remainingAmount: -500,
            percentRemaining: 0,
          },
        ],
      }),
      NOW,
    );
    expect(home?.envelopes[0]).toMatchObject({
      spentCents: 1500,
      totalCents: 1000,
      progress: 100,
    });
  });

  it("deja en Hoy solo los movimientos del día en Lima", () => {
    const home = mapDashboardHome(summary(), NOW);
    expect(home?.todayMovements).toEqual([
      {
        id: "e1",
        name: "Menú del día",
        amountCents: 1500,
        tone: "wants",
      },
    ]);
  });

  it("marca un ingreso sin sobre como ingreso, no como gasto", () => {
    const home = mapDashboardHome(
      summary({
        movements: [
          {
            id: "i1",
            kind: "income",
            label: "Sueldo",
            amount: 350000,
            timestamp: TODAY_MOVE,
          },
        ],
      }),
      NOW,
    );
    expect(home?.todayMovements).toEqual([
      { id: "i1", name: "Sueldo", amountCents: 350000, tone: "income" },
    ]);
  });
});
