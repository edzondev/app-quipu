import { describe, expect, it } from "vitest";
import {
  computeDailyAvailableFromSpendable,
  computeDailyImpact,
  computeSpendableCents,
  computeSpendableSnapshot,
} from "./spendableBalance";

describe("spendableBalance", () => {
  it("spendable is needs + wants only", () => {
    expect(
      computeSpendableCents({
        needsRemainingCents: 80_00,
        wantsRemainingCents: 20_00,
      }),
    ).toBe(100_00);
  });

  it("daily available uses spendable and days remaining", () => {
    expect(computeDailyAvailableFromSpendable(100_00, 10)).toBe(10_00);
    expect(computeDailyAvailableFromSpendable(100_00, 0)).toBe(100_00);
  });

  it("snapshot excludes reserved, unallocated, and savings parked", () => {
    const snap = computeSpendableSnapshot({
      needsRemainingCents: 50_00,
      wantsRemainingCents: 50_00,
      savingsRemainingCents: 99_080,
      unallocatedCents: 5_237,
      activeReservedCents: 250_000,
      daysRemaining: 10,
    });
    expect(snap.spendableCents).toBe(100_00);
    expect(snap.reservedCents).toBe(250_000);
    expect(snap.unallocatedCents).toBe(5_237);
    expect(snap.savingsParkedInEnvelopeCents).toBe(99_080);
    expect(snap.dailyAvailableCents).toBe(10_00);
  });

  it("daily impact amortizes the drop over remaining days", () => {
    expect(
      computeDailyImpact({
        spendableBeforeCents: 202_000,
        spendableAfterCents: 102_000,
        daysRemaining: 40,
      }),
    ).toEqual({
      dailyBeforeCents: 50_50,
      dailyAfterCents: 25_50,
      dailyDeltaCents: -25_00,
    });
  });

  it("daily impact is zero when spendable stays clamped at 0", () => {
    expect(
      computeDailyImpact({
        spendableBeforeCents: 0,
        spendableAfterCents: 0,
        daysRemaining: 12,
      }),
    ).toEqual({
      dailyBeforeCents: 0,
      dailyAfterCents: 0,
      dailyDeltaCents: 0,
    });
  });

  it("daily impact treats zero days remaining as one", () => {
    expect(
      computeDailyImpact({
        spendableBeforeCents: 10_00,
        spendableAfterCents: 5_00,
        daysRemaining: 0,
      }),
    ).toEqual({
      dailyBeforeCents: 10_00,
      dailyAfterCents: 5_00,
      dailyDeltaCents: -5_00,
    });
  });
});
