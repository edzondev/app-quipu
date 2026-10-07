import {
  mapSobresScreen,
  savingsLineFromOverview,
} from "@/shared/lib/dashboard/sobres-model";

function summary(
  overrides: Partial<NonNullable<Parameters<typeof mapSobresScreen>[0]>> = {},
) {
  return {
    profile: { name: "Edzon", currencyCode: "PEN" },
    cycle: {
      startDate: Date.UTC(2026, 7, 1, 5, 0, 0),
      daysTotal: 30,
      daysRemaining: 15,
      daysElapsed: 15,
      progressPercent: 50,
    },
    envelopes: [
      {
        type: "needs" as const,
        allocatedAmount: 175_000,
        remainingAmount: 113_800,
        percentRemaining: 65,
      },
      {
        type: "wants" as const,
        allocatedAmount: 105_000,
        remainingAmount: 23_100,
        percentRemaining: 22,
      },
      {
        type: "savings" as const,
        allocatedAmount: 70_000,
        remainingAmount: 70_000,
        percentRemaining: 100,
      },
    ],
    commitments: [
      {
        id: "rent",
        name: "Alquiler",
        amount: 110_000,
        envelope: "needs" as const,
        daysUntilDue: 1,
        paymentStatus: "pending" as const,
      },
      {
        id: "paid",
        name: "Netflix",
        amount: 3_000,
        envelope: "wants" as const,
        daysUntilDue: 2,
        paymentStatus: "paid" as const,
      },
    ],
    ...overrides,
  };
}

describe("mapSobresScreen", () => {
  it("devuelve null sin ciclo", () => {
    expect(mapSobresScreen(summary({ cycle: null }))).toBeNull();
    expect(mapSobresScreen(null)).toBeNull();
  });

  it("arma la barra y el ritmo del tratamiento 1h", () => {
    const screen = mapSobresScreen(summary(), "FONDO + VIAJE");
    expect(screen?.dayLabel).toBe("DÍA 15 / 30");
    expect(screen?.envelopes).toEqual([
      {
        tone: "needs",
        label: "Necesidades",
        statusLabel: "Al día",
        statusTone: "calm",
        symbol: "S/",
        negative: false,
        amountLabel: "1,138",
        budgetLabel: "de S/ 1,750",
        progress: 35,
        footLeft: "GASTADO S/ 612",
        footRight: "ALQUILER PENDIENTE",
        footRightTone: "calm",
      },
      {
        tone: "wants",
        label: "Gustos",
        statusLabel: "Va rápido",
        statusTone: "fast",
        symbol: "S/",
        negative: false,
        amountLabel: "231",
        budgetLabel: "de S/ 1,050",
        progress: 78,
        footLeft: "GASTADO S/ 819",
        footRight: "ALCANZA 6 DÍAS",
        footRightTone: "fast",
      },
      {
        tone: "savings",
        label: "Ahorro",
        statusLabel: "Intacto",
        statusTone: "calm",
        symbol: "S/",
        negative: false,
        amountLabel: "700",
        budgetLabel: "apartado este ciclo",
        progress: 100,
        footLeft: "FONDO + VIAJE",
        footRight: "100%",
        footRightTone: "calm",
      },
    ]);
    expect(JSON.stringify(screen)).not.toContain("rent");
  });

  it("ordena los sobres aunque el resumen venga al revés", () => {
    const base = summary();
    const screen = mapSobresScreen(
      summary({
        envelopes: [...base.envelopes].reverse(),
      }),
    );
    expect(screen?.envelopes.map((envelope) => envelope.tone)).toEqual([
      "needs",
      "wants",
      "savings",
    ]);
  });

  it("deja el pie quieto cuando el ritmo alcanza el ciclo y no hay compromiso", () => {
    const screen = mapSobresScreen(
      summary({
        commitments: [],
        envelopes: [
          {
            type: "wants",
            allocatedAmount: 105_000,
            remainingAmount: 90_000,
            percentRemaining: 86,
          },
        ],
      }),
    );
    expect(screen?.envelopes[0]).toMatchObject({
      statusLabel: "Al día",
      footRight: null,
      progress: 14,
    });
  });

  it("prioriza el ritmo cuando el sobre no llega al cierre", () => {
    const screen = mapSobresScreen(
      summary({
        envelopes: [
          {
            type: "wants",
            allocatedAmount: 30_000,
            remainingAmount: 1_500,
            percentRemaining: 5,
          },
        ],
        commitments: [
          {
            id: "secret-id",
            name: "Cine",
            envelope: "wants",
            daysUntilDue: 3,
            paymentStatus: "pending",
          },
        ],
      }),
    );
    expect(screen?.envelopes[0]).toMatchObject({
      statusLabel: "Va rápido",
      footRight: "ALCANZA 1 DÍA",
      footRightTone: "fast",
    });
    expect(JSON.stringify(screen)).not.toContain("secret-id");
    expect(JSON.stringify(screen)).not.toContain("CINE");
  });

  it("marca el sobre en negativo y llena la barra", () => {
    const screen = mapSobresScreen(
      summary({
        envelopes: [
          {
            type: "needs",
            allocatedAmount: 1_000,
            remainingAmount: -500,
            percentRemaining: 0,
          },
        ],
        commitments: [],
      }),
    );
    expect(screen?.envelopes[0]).toMatchObject({
      negative: true,
      amountLabel: "5",
      progress: 100,
      statusLabel: "Va rápido",
      footLeft: "GASTADO S/ 15",
      footRight: "ALCANZA 0 DÍAS",
    });
  });

  it("no llama intacto al ahorro que ya salió del sobre", () => {
    const screen = mapSobresScreen(
      summary({
        envelopes: [
          {
            type: "savings",
            allocatedAmount: 70_000,
            remainingAmount: 35_000,
            percentRemaining: 50,
          },
        ],
      }),
      "FONDO",
    );
    expect(screen?.envelopes[0]).toMatchObject({
      statusLabel: null,
      amountLabel: "350",
      progress: 50,
      footLeft: "FONDO",
      footRight: "50%",
    });
  });
});

describe("savingsLineFromOverview", () => {
  it("une fondo y metas en mayúsculas, sin ids", () => {
    const line = savingsLineFromOverview({
      emergencyFund: { id: "sub_secret", label: " Fondo " },
      goals: [
        { id: "goal_secret", label: "Viaje" },
        { id: "blank", label: "   " },
      ],
    });
    expect(line).toBe("FONDO + VIAJE");
    expect(line).not.toContain("secret");
  });

  it("devuelve null si aún no hay nombres", () => {
    expect(savingsLineFromOverview(undefined)).toBeNull();
    expect(savingsLineFromOverview(null)).toBeNull();
    expect(
      savingsLineFromOverview({ emergencyFund: null, goals: [] }),
    ).toBeNull();
  });
});
