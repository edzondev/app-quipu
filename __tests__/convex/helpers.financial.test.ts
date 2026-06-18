import { describe, expect, it } from "vitest";
import {
  commitment,
  dependentProfile,
  expense,
  independentProfile,
  savingsGoal,
  savingsSubEnvelope,
} from "@/__tests__/fixtures/financial";
import {
  computeEnvelopesFromData,
  computePauseModeCarryoverFromEnvelopes,
  computePauseModeFromData,
  distributeSavingsFromData,
} from "@/convex/helpers";

const MONTH = "2026-06";

describe("computeEnvelopesFromData", () => {
  describe("dependent worker", () => {
    it("allocates 50/30/20 from monthly income when there are no commitments or expenses", () => {
      const profile = dependentProfile({ monthlyIncome: 3000 });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.netIncome).toBe(3000);
      expect(result.envelopes.needs.allocated).toBe(1500);
      expect(result.envelopes.wants.allocated).toBe(900);
      expect(result.envelopes.savings.allocated).toBe(600);
      expect(
        result.envelopes.needs.allocated +
          result.envelopes.wants.allocated +
          result.envelopes.savings.allocated,
      ).toBe(result.netIncome);
    });

    it("subtracts fixed commitments before applying allocations", () => {
      const profile = dependentProfile({ monthlyIncome: 3000 });
      const commitments = [
        commitment(500, "needs", "Rent"),
        commitment(200, "wants", "Streaming"),
      ];
      const result = computeEnvelopesFromData(profile, MONTH, commitments, []);

      expect(result.fixedNeeds).toBe(500);
      expect(result.fixedWants).toBe(200);
      expect(result.totalFixed).toBe(700);
      expect(result.netIncome).toBe(2300);
      expect(result.envelopes.needs.allocated).toBe(1150);
      expect(result.envelopes.wants.allocated).toBe(690);
      expect(result.envelopes.savings.allocated).toBe(460);
    });

    it("uses initialRemainingBudget for the first partial month and ignores fixed commitments", () => {
      const profile = dependentProfile({
        monthlyIncome: 3000,
        initialRemainingBudget: 800,
        initialBudgetMonth: MONTH,
      });
      const commitments = [commitment(500, "needs")];
      const result = computeEnvelopesFromData(profile, MONTH, commitments, []);

      expect(result.netIncome).toBe(800);
      expect(result.envelopes.needs.allocated).toBe(400);
      expect(result.envelopes.wants.allocated).toBe(240);
      expect(result.envelopes.savings.allocated).toBe(160);
    });

    it("falls back to normal calculation once the first payday has been processed", () => {
      const profile = dependentProfile({
        monthlyIncome: 3000,
        initialRemainingBudget: 800,
        initialBudgetMonth: MONTH,
        lastPaydayProcessedAt: "2026-06-01",
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.netIncome).toBe(3000);
    });

    it("reduces available balances by current-month expenses", () => {
      const profile = dependentProfile({ monthlyIncome: 3000 });
      const expenses = [
        expense(400, "needs", `${MONTH}-05`),
        expense(150, "wants", `${MONTH}-10`),
      ];
      const result = computeEnvelopesFromData(profile, MONTH, [], expenses);

      expect(result.envelopes.needs.available).toBe(1100);
      expect(result.envelopes.wants.available).toBe(750);
    });

    it("includes juntos envelope only when couple mode is enabled", () => {
      const single = dependentProfile({ coupleModeEnabled: false });
      expect(
        computeEnvelopesFromData(single, MONTH, [], []).envelopes.juntos,
      ).toBeNull();

      const couple = dependentProfile({
        coupleModeEnabled: true,
        coupleMonthlyBudget: 500,
      });
      const result = computeEnvelopesFromData(couple, MONTH, [], []);
      expect(result.envelopes.juntos).toEqual({
        budget: 500,
        spent: 0,
        available: 500,
      });
    });

    it("applies rescue transfer_from_savings offset when applied in the same month", () => {
      const profile = dependentProfile({
        monthlyIncome: 3000,
        rescueActionId: "transfer_from_savings",
        rescueAppliedAt: new Date("2026-06-15T00:00:00.000Z").getTime(),
        envelopeNeeds: 200,
        envelopeWants: 100,
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.envelopes.needs.allocated).toBe(1700);
      expect(result.envelopes.wants.allocated).toBe(1000);
      expect(result.envelopes.savings.allocated).toBe(300);
    });

    it("ignores rescue offset when applied in a different month", () => {
      const profile = dependentProfile({
        monthlyIncome: 3000,
        rescueActionId: "transfer_from_savings",
        rescueAppliedAt: new Date("2026-05-15T00:00:00.000Z").getTime(),
        envelopeNeeds: 200,
        envelopeWants: 100,
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.envelopes.needs.allocated).toBe(1500);
      expect(result.envelopes.wants.allocated).toBe(900);
      expect(result.envelopes.savings.allocated).toBe(600);
    });

    it("clamps savings allocation to non-negative when rescue exceeds savings allocation", () => {
      const profile = dependentProfile({
        monthlyIncome: 1000,
        allocationNeeds: 80,
        allocationWants: 10,
        allocationSavings: 10,
        rescueActionId: "transfer_from_savings",
        rescueAppliedAt: new Date("2026-06-15T00:00:00.000Z").getTime(),
        envelopeNeeds: 500,
        envelopeWants: 200,
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.envelopes.savings.allocated).toBe(0);
    });

    it("produces zero allocations when monthly income is zero", () => {
      const profile = dependentProfile({ monthlyIncome: 0 });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.netIncome).toBe(0);
      expect(result.envelopes.needs.allocated).toBe(0);
      expect(result.envelopes.wants.allocated).toBe(0);
      expect(result.envelopes.savings.allocated).toBe(0);
    });
  });

  describe("independent worker", () => {
    it("uses accumulated envelope fields directly", () => {
      const profile = independentProfile({
        envelopeNeeds: 1500,
        envelopeWants: 900,
        envelopeSavings: 600,
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.netIncome).toBe(3000);
      expect(result.envelopes.needs.allocated).toBe(1500);
      expect(result.envelopes.wants.allocated).toBe(900);
      expect(result.envelopes.savings.allocated).toBe(600);
    });

    it("ignores monthly income and allocations for independent workers", () => {
      const profile = independentProfile({
        monthlyIncome: 9999,
        allocationNeeds: 10,
        allocationWants: 10,
        allocationSavings: 80,
        envelopeNeeds: 100,
        envelopeWants: 200,
        envelopeSavings: 300,
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.envelopes.needs.allocated).toBe(100);
      expect(result.envelopes.wants.allocated).toBe(200);
      expect(result.envelopes.savings.allocated).toBe(300);
    });

    it("defaults missing envelope balances to zero", () => {
      const profile = independentProfile({});
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      expect(result.netIncome).toBe(0);
      expect(result.envelopes.needs.allocated).toBe(0);
    });
  });

  describe("money conservation", () => {
    it("preserves net income across the three operational envelopes for dependent workers", () => {
      const profile = dependentProfile({ monthlyIncome: 3000 });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      const sum =
        result.envelopes.needs.allocated +
        result.envelopes.wants.allocated +
        result.envelopes.savings.allocated;
      expect(sum).toBeCloseTo(result.netIncome, 10);
    });

    it("preserves net income across the three operational envelopes for independent workers", () => {
      const profile = independentProfile({
        envelopeNeeds: 1234.56,
        envelopeWants: 789.12,
        envelopeSavings: 345.67,
      });
      const result = computeEnvelopesFromData(profile, MONTH, [], []);

      const sum =
        result.envelopes.needs.allocated +
        result.envelopes.wants.allocated +
        result.envelopes.savings.allocated;
      expect(sum).toBeCloseTo(result.netIncome, 10);
    });
  });
});

describe("computePauseModeFromData", () => {
  it("returns null when pause mode is not active", () => {
    const profile = dependentProfile({ pauseModeActive: false });
    expect(computePauseModeFromData(profile, [])).toBeNull();
  });

  it("returns null when pause mode fields are missing", () => {
    const profile = dependentProfile({ pauseModeActive: true });
    expect(computePauseModeFromData(profile, [])).toBeNull();
  });

  it("returns the full fund when no expenses have occurred since pause started", () => {
    const profile = dependentProfile({
      pauseModeActive: true,
      pauseModeFund: 1000,
      pauseModeStartedAt: "2026-06-01",
    });
    const result = computePauseModeFromData(profile, []);
    expect(result).toEqual({
      active: true,
      fund: 1000,
      startedAt: "2026-06-01",
      spent: 0,
      remaining: 1000,
    });
  });

  it("sums every expense since the pause start date", () => {
    const profile = dependentProfile({
      pauseModeActive: true,
      pauseModeFund: 1000,
      pauseModeStartedAt: "2026-06-01",
    });
    const expenses = [
      expense(100, "needs", "2026-06-05"),
      expense(200, "wants", "2026-06-10"),
      expense(50, "juntos", "2026-06-15"),
    ];
    const result = computePauseModeFromData(profile, expenses);
    expect(result?.spent).toBe(350);
    expect(result?.remaining).toBe(650);
  });
});

describe("computePauseModeCarryoverFromEnvelopes", () => {
  it("sums positive available balances from needs and wants", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 3000 }),
      MONTH,
      [],
      [],
    );
    expect(computePauseModeCarryoverFromEnvelopes(computed)).toBe(2400);
  });

  it("clamps negative availability to zero", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(600, "needs"), expense(500, "wants")],
    );
    expect(computed.envelopes.needs.available).toBeLessThan(0);
    expect(computed.envelopes.wants.available).toBeLessThan(0);
    expect(computePauseModeCarryoverFromEnvelopes(computed)).toBe(0);
  });

  it("ignores savings envelope in carryover", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 3000 }),
      MONTH,
      [],
      [],
    );
    expect(computePauseModeCarryoverFromEnvelopes(computed)).not.toBe(
      computed.envelopes.savings.allocated,
    );
  });
});

describe("distributeSavingsFromData", () => {
  it("returns unchanged state when savings amount is zero or negative", () => {
    const subEnvelopes = [
      savingsSubEnvelope("emergency", 100, 1000),
      savingsSubEnvelope("short_term", 200, 1000),
      savingsSubEnvelope("investment", 300, 1000),
    ];
    const goals = [savingsGoal("Vacation", 1000, 0, 100)];

    expect(distributeSavingsFromData(0, subEnvelopes, goals)).toMatchObject({
      subEnvelopes: subEnvelopes.map((s) => ({
        currentAmount: s.currentAmount,
      })),
      goals: goals.map((g) => ({ currentAmount: g.currentAmount })),
    });

    expect(distributeSavingsFromData(-50, subEnvelopes, goals)).toMatchObject({
      subEnvelopes: subEnvelopes.map((s) => ({
        currentAmount: s.currentAmount,
      })),
      goals: goals.map((g) => ({ currentAmount: g.currentAmount })),
    });
  });

  it("distributes savings equally across the three sub-envelopes", () => {
    const subEnvelopes = [
      savingsSubEnvelope("emergency", 0, 1000),
      savingsSubEnvelope("short_term", 0, 1000),
      savingsSubEnvelope("investment", 0, 1000),
    ];
    const result = distributeSavingsFromData(300, subEnvelopes, []);

    for (const sub of result.subEnvelopes) {
      expect(sub.currentAmount).toBeCloseTo(100, 10);
    }
  });

  it("updates progress percentage for each sub-envelope", () => {
    const subEnvelopes = [
      savingsSubEnvelope("emergency", 0, 1000),
      savingsSubEnvelope("short_term", 500, 1000),
      savingsSubEnvelope("investment", 0, 0),
    ];
    const result = distributeSavingsFromData(300, subEnvelopes, []);

    expect(result.subEnvelopes[0].progress).toBe(10);
    expect(result.subEnvelopes[1].progress).toBe(60);
    expect(result.subEnvelopes[2].progress).toBe(100);
  });

  it("caps progress at 100%", () => {
    const subEnvelopes = [savingsSubEnvelope("emergency", 950, 1000)];
    const result = distributeSavingsFromData(300, subEnvelopes, []);
    expect(result.subEnvelopes[0].progress).toBe(100);
  });

  it("advances active savings goals by their monthly required amount", () => {
    const subEnvelopes = [
      savingsSubEnvelope("emergency", 0, 1000),
      savingsSubEnvelope("short_term", 0, 1000),
      savingsSubEnvelope("investment", 0, 1000),
    ];
    const goals = [savingsGoal("Vacation", 1000, 0, 100)];
    const result = distributeSavingsFromData(300, subEnvelopes, goals);

    expect(result.goals[0].currentAmount).toBe(100);
  });

  it("caps goal contribution so the goal does not exceed its target", () => {
    const subEnvelopes = [
      savingsSubEnvelope("emergency", 0, 1000),
      savingsSubEnvelope("short_term", 0, 1000),
      savingsSubEnvelope("investment", 0, 1000),
    ];
    const goals = [savingsGoal("Vacation", 1000, 950, 100)];
    const result = distributeSavingsFromData(300, subEnvelopes, goals);

    expect(result.goals[0].currentAmount).toBe(1000);
  });

  it("does not advance goals that have already reached their target", () => {
    const subEnvelopes = [
      savingsSubEnvelope("emergency", 0, 1000),
      savingsSubEnvelope("short_term", 0, 1000),
      savingsSubEnvelope("investment", 0, 1000),
    ];
    const goals = [savingsGoal("Vacation", 1000, 1000, 100)];
    const result = distributeSavingsFromData(300, subEnvelopes, goals);

    expect(result.goals[0].currentAmount).toBe(1000);
  });
});
