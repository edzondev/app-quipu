import { describe, expect, it } from "vitest";
import {
  computeHasProcessed,
  computeIncomeAllocation,
  computeNextPaydayDate,
  computePaydayDistribution,
} from "@/convex/payday";

describe("computeHasProcessed", () => {
  it("returns false when no payday has been processed", () => {
    expect(
      computeHasProcessed(undefined, "monthly", [15], "2026-06-15", "2026-06"),
    ).toBe(false);
  });

  it("returns false when last processed date is in a previous month", () => {
    expect(
      computeHasProcessed(
        "2026-05-30",
        "monthly",
        [15],
        "2026-06-15",
        "2026-06",
      ),
    ).toBe(false);
  });

  it("returns true for monthly frequency when processed in the same month", () => {
    expect(
      computeHasProcessed(
        "2026-06-01",
        "monthly",
        [15],
        "2026-06-15",
        "2026-06",
      ),
    ).toBe(true);
  });

  it("returns true for biweekly frequency when the matching payday has been processed", () => {
    expect(
      computeHasProcessed(
        "2026-06-15",
        "biweekly",
        [15, 30],
        "2026-06-15",
        "2026-06",
      ),
    ).toBe(true);
    expect(
      computeHasProcessed(
        "2026-06-30",
        "biweekly",
        [15, 30],
        "2026-06-30",
        "2026-06",
      ),
    ).toBe(true);
  });

  it("returns false for biweekly frequency when the matching payday has not been processed", () => {
    // Processed the first payday, now it's the second one
    expect(
      computeHasProcessed(
        "2026-06-15",
        "biweekly",
        [15, 30],
        "2026-06-30",
        "2026-06",
      ),
    ).toBe(false);
    // Processed a monthly payday on day 1, switched to biweekly, today is the 15th
    expect(
      computeHasProcessed(
        "2026-06-01",
        "biweekly",
        [15, 30],
        "2026-06-15",
        "2026-06",
      ),
    ).toBe(false);
    // Today is before any configured payday
    expect(
      computeHasProcessed(
        "2026-06-20",
        "biweekly",
        [15, 30],
        "2026-06-10",
        "2026-06",
      ),
    ).toBe(false);
  });
});

describe("computeNextPaydayDate", () => {
  it("returns the next payday later in the same month", () => {
    const result = computeNextPaydayDate([15, 30], new Date("2026-06-10"));
    expect(result).toBe("2026-06-15");
  });

  it("wraps to the next month when all paydays have passed", () => {
    const result = computeNextPaydayDate([15], new Date("2026-06-20"));
    expect(result).toBe("2026-07-15");
  });

  it("wraps to the next year when in December", () => {
    const result = computeNextPaydayDate([15], new Date("2026-12-20"));
    expect(result).toBe("2027-01-15");
  });

  it("caps the payday to the last day of the month if payday exceeds month length", () => {
    const result = computeNextPaydayDate([31], new Date("2026-02-01"));
    expect(result).toBe("2026-02-28");
  });
});

describe("computePaydayDistribution", () => {
  it("computes savings amount from monthly income minus fixed commitments", () => {
    const result = computePaydayDistribution(
      3000,
      20,
      [{ amount: 500 }, { amount: 200 }],
      [],
    );

    expect(result.totalFixed).toBe(700);
    expect(result.extraIncomesTotal).toBe(0);
    expect(result.netIncome).toBe(2300);
    expect(result.savingsAmount).toBe(460);
  });

  it("includes extra incomes marked to include in budget", () => {
    const result = computePaydayDistribution(
      3000,
      20,
      [{ amount: 500 }],
      [
        { amount: 300, includeInBudget: true },
        { amount: 100, includeInBudget: false },
      ],
    );

    expect(result.extraIncomesTotal).toBe(300);
    expect(result.netIncome).toBe(2800);
    expect(result.savingsAmount).toBe(560);
  });

  it("handles zero monthly income", () => {
    const result = computePaydayDistribution(0, 20, [], []);

    expect(result.netIncome).toBe(0);
    expect(result.savingsAmount).toBe(0);
  });

  it("produces negative net income when fixed commitments exceed income", () => {
    const result = computePaydayDistribution(1000, 20, [{ amount: 1500 }], []);

    expect(result.netIncome).toBe(-500);
    expect(result.savingsAmount).toBe(-100);
  });

  it("prorates monthly income for biweekly users with two paydays", () => {
    const result = computePaydayDistribution(
      7000,
      20,
      [],
      [],
      "biweekly",
      [15, 30],
    );

    // effectiveIncome = 7000 / 2 = 3500 per payday
    expect(result.netIncome).toBe(3500);
    expect(result.savingsAmount).toBe(700);
  });

  it("does not prorate for monthly users even when paydays are provided", () => {
    const result = computePaydayDistribution(
      3000,
      20,
      [{ amount: 500 }],
      [],
      "monthly",
      [15],
    );

    expect(result.netIncome).toBe(2500);
    expect(result.savingsAmount).toBe(500);
  });

  it("handles biweekly with single payday array gracefully", () => {
    const result = computePaydayDistribution(
      4000,
      20,
      [],
      [],
      "biweekly",
      [15],
    );

    // Only 1 payday in array, so no proration
    expect(result.netIncome).toBe(4000);
    expect(result.savingsAmount).toBe(800);
  });
});

describe("computeIncomeAllocation", () => {
  it("splits income according to 50/30/20 allocations", () => {
    const result = computeIncomeAllocation(1000, 50, 30, 20);

    expect(result.needs).toBe(500);
    expect(result.wants).toBe(300);
    expect(result.savings).toBe(200);
  });

  it("preserves the total amount across allocations", () => {
    const result = computeIncomeAllocation(3333.33, 50, 30, 20);

    const sum = result.needs + result.wants + result.savings;
    expect(sum).toBeCloseTo(3333.33, 10);
  });
});
