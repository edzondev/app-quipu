import { describe, expect, it } from "vitest";
import {
  buildDailyRateCopy,
  buildEarlyCycleCoachMessage,
  buildEarlyCycleHeroBody,
  computeCommitmentCoverageMvp,
  computeCycleDayMetrics,
  computeCycleProgress,
  computeDailyAvailable,
  computeDisplayDailyCents,
  daysUntilDueDay,
  detectEarlyCycle,
  MS_PER_DAY,
  mapComplianceToBadge,
  mergeRecentMovements,
  resolveHeroStatusBadge,
} from "./dashboardMath";

describe("buildDailyRateCopy", () => {
  it("expresa el héroe como tasa diaria con saldo y horizonte", () => {
    const copy = buildDailyRateCopy({
      dailyCents: 50_50,
      spendableCents: 191_900,
      daysRemaining: 38,
      currencySymbol: "S/",
    });
    expect(copy).toBe(
      "≈ S/ 50.50 por día. Te quedan S/ 1,919.00 en sobres para 38 días.",
    );
  });

  it("un solo día restante se lee como 'para hoy'", () => {
    expect(
      buildDailyRateCopy({
        dailyCents: 10_00,
        spendableCents: 10_00,
        daysRemaining: 1,
        currencySymbol: "S/",
      }),
    ).toBe("≈ S/ 10.00 por día. Te quedan S/ 10.00 en sobres para hoy.");
  });
});

describe("computeCycleDayMetrics", () => {
  const start = Date.parse("2026-09-03T00:00:00-05:00");
  const end = start + 30 * MS_PER_DAY;

  it("cuenta días calendario Lima inclusivos (8 sep → día 6)", () => {
    const now = Date.parse("2026-09-08T12:30:00-05:00");
    const m = computeCycleDayMetrics(start, end, now);
    expect(m.daysTotal).toBe(30);
    expect(m.daysElapsed).toBe(6);
    expect(m.daysRemaining).toBe(24);
  });

  it("normaliza ciclos legacy anclados a media tarde (15:47)", () => {
    const legacyStart = Date.parse("2026-09-03T15:47:00-05:00");
    const legacyEnd = legacyStart + 30 * MS_PER_DAY;
    const now = Date.parse("2026-09-08T12:30:00-05:00");
    const m = computeCycleDayMetrics(legacyStart, legacyEnd, now);
    expect(m.daysTotal).toBe(30);
    expect(m.daysElapsed).toBe(6);
    expect(m.daysRemaining).toBe(24);
  });

  it("el día de inicio cuenta como día 1", () => {
    const now = Date.parse("2026-09-03T10:00:00-05:00");
    const m = computeCycleDayMetrics(start, end, now);
    expect(m.daysElapsed).toBe(1);
    expect(m.daysRemaining).toBe(29);
  });

  it("cruce de mes: pago del 30 sep registrado el 2 oct, ciclo de 15 días", () => {
    const octStart = Date.parse("2026-10-02T00:00:00-05:00");
    const octEnd = octStart + 15 * MS_PER_DAY;
    const now = Date.parse("2026-10-02T20:00:00-05:00");
    const m = computeCycleDayMetrics(octStart, octEnd, now);
    expect(m.daysTotal).toBe(15);
    expect(m.daysElapsed).toBe(1);
    expect(m.daysRemaining).toBe(14);
  });

  it("clamp a 0 si now es anterior al inicio", () => {
    const now = Date.parse("2026-09-01T12:00:00-05:00");
    const m = computeCycleDayMetrics(start, end, now);
    expect(m.daysElapsed).toBe(0);
  });
});

describe("computeDailyAvailable", () => {
  it("floors wants remaining over days remaining", () => {
    expect(computeDailyAvailable(8250, 12)).toBe(687);
  });

  it("uses at least 1 day to avoid division by zero", () => {
    expect(computeDailyAvailable(5000, 0)).toBe(5000);
  });
});

describe("computeDisplayDailyCents", () => {
  it("clamps negative daily to zero for display", () => {
    expect(computeDisplayDailyCents(-120)).toBe(0);
    expect(computeDisplayDailyCents(8250)).toBe(8250);
  });
});

describe("computeCycleProgress", () => {
  const start = 0;
  const end = 30 * MS_PER_DAY;

  it("returns 0 at cycle start", () => {
    expect(computeCycleProgress(start, end, 0)).toBe(0);
  });

  it("returns 1 at or after cycle end", () => {
    expect(computeCycleProgress(start, end, end)).toBe(1);
    expect(computeCycleProgress(start, end, end + MS_PER_DAY)).toBe(1);
  });

  it("returns midpoint at half cycle", () => {
    expect(computeCycleProgress(start, end, 15 * MS_PER_DAY)).toBe(0.5);
  });
});

describe("mapComplianceToBadge", () => {
  it("maps compliance states to dashboard badges", () => {
    expect(mapComplianceToBadge("compliant")).toBe("stable");
    expect(mapComplianceToBadge("warning")).toBe("attention");
    expect(mapComplianceToBadge("failed")).toBe("risk");
  });
});

describe("detectEarlyCycle", () => {
  it("returns false when the cycle already has expenses", () => {
    expect(
      detectEarlyCycle({
        expenseCount: 1,
        daysElapsed: 0,
        movementCount: 0,
      }),
    ).toBe(false);
  });

  it("returns true on day one without expenses", () => {
    expect(
      detectEarlyCycle({
        expenseCount: 0,
        daysElapsed: 1,
        movementCount: 2,
      }),
    ).toBe(true);
  });

  it("returns true with zero movements even after day one", () => {
    expect(
      detectEarlyCycle({
        expenseCount: 0,
        daysElapsed: 5,
        movementCount: 0,
      }),
    ).toBe(true);
  });

  it("returns false after day one when movements exist but no expenses", () => {
    expect(
      detectEarlyCycle({
        expenseCount: 0,
        daysElapsed: 5,
        movementCount: 1,
      }),
    ).toBe(false);
  });
});

describe("resolveHeroStatusBadge", () => {
  it("uses the starting badge during early cycle", () => {
    expect(resolveHeroStatusBadge("compliant", true)).toBe("starting");
  });

  it("falls back to compliance mapping after early cycle", () => {
    expect(resolveHeroStatusBadge("warning", false)).toBe("attention");
  });
});

describe("early cycle copy", () => {
  it("builds hero and coach messages for the welcome state", () => {
    expect(buildEarlyCycleHeroBody()).toContain("Registra tu primer gasto");
    expect(buildEarlyCycleCoachMessage("Ana")).toContain("50/30/20");
    expect(buildEarlyCycleCoachMessage("Ana")).toContain("Ana");
  });
});

describe("computeCommitmentCoverageMvp", () => {
  it("marks covered when envelope has enough remaining", () => {
    expect(computeCommitmentCoverageMvp(120_000, 150_000)).toBe("covered");
  });

  it("marks partial when some but not enough remaining", () => {
    expect(computeCommitmentCoverageMvp(120_000, 50_000)).toBe("partial");
  });

  it("marks uncovered when envelope is empty or negative", () => {
    expect(computeCommitmentCoverageMvp(120_000, 0)).toBe("uncovered");
    expect(computeCommitmentCoverageMvp(120_000, -500)).toBe("uncovered");
  });
});

describe("daysUntilDueDay", () => {
  it("returns days until due day in the same Lima month", () => {
    const now = Date.parse("2026-07-16T15:00:00-05:00");
    expect(daysUntilDueDay(20, now)).toBe(4);
  });

  it("wraps to next month when due day already passed", () => {
    const now = Date.parse("2026-07-25T15:00:00-05:00");
    expect(daysUntilDueDay(5, now)).toBe(11);
  });
});

describe("mergeRecentMovements", () => {
  it("merges and sorts expenses and incomes by timestamp desc", () => {
    const merged = mergeRecentMovements(
      [
        {
          id: "e1",
          description: "Café",
          amount: 1200,
          timestamp: 100,
          envelopeType: "wants",
        },
        {
          id: "e2",
          description: "Mercado",
          amount: 8640,
          timestamp: 300,
          envelopeType: "needs",
        },
      ],
      [
        {
          id: "i1",
          description: "Proyecto",
          amount: 90000,
          occurredAt: 200,
        },
      ],
      4,
    );

    expect(merged.map((m) => m.id)).toEqual(["e2", "i1", "e1"]);
    expect(merged[0]?.kind).toBe("expense");
    expect(merged[1]?.kind).toBe("income");
  });

  it("respects the limit", () => {
    const merged = mergeRecentMovements(
      [
        {
          id: "e1",
          description: "A",
          amount: 100,
          timestamp: 4,
        },
        {
          id: "e2",
          description: "B",
          amount: 100,
          timestamp: 3,
        },
      ],
      [
        {
          id: "i1",
          description: "C",
          amount: 100,
          occurredAt: 2,
        },
        {
          id: "i2",
          description: "D",
          amount: 100,
          occurredAt: 1,
        },
      ],
      3,
    );

    expect(merged).toHaveLength(3);
  });
});
