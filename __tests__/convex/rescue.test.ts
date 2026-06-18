import { describe, expect, it } from "vitest";
import {
  dependentProfile,
  expense,
  independentProfile,
} from "@/__tests__/fixtures/financial";
import { computeEnvelopesFromData } from "@/convex/helpers";
import { computeRescueDeficit, computeRescueTransfer } from "@/convex/rescue";

const MONTH = "2026-06";

describe("computeRescueDeficit", () => {
  it("returns null envelope when there is no overflow", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 3000 }),
      MONTH,
      [],
      [],
    );
    const result = computeRescueDeficit(computed);

    expect(result.envelope).toBeNull();
    expect(result.deficit).toBe(0);
    expect(result.needsOverflow).toBeLessThanOrEqual(0);
    expect(result.wantsOverflow).toBeLessThanOrEqual(0);
  });

  it("detects needs overflow and gives it priority over wants", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(600, "needs"), expense(300, "wants")],
    );
    const result = computeRescueDeficit(computed);

    expect(result.envelope).toBe("needs");
    expect(result.deficit).toBeGreaterThan(0);
  });

  it("detects wants overflow when needs is within budget", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(100, "needs"), expense(500, "wants")],
    );
    const result = computeRescueDeficit(computed);

    expect(result.envelope).toBe("wants");
    expect(result.deficit).toBeGreaterThan(0);
  });
});

describe("computeRescueTransfer", () => {
  it("transfers the full deficit when savings are sufficient", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(600, "needs")],
    );
    const result = computeRescueTransfer(computed, 200);

    expect(result.targetEnvelope).toBe("needs");
    expect(result.transferAmount).toBe(100);
  });

  it("transfers only available savings when deficit is larger", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(600, "needs")],
    );
    const result = computeRescueTransfer(computed, 50);

    expect(result.transferAmount).toBe(50);
  });

  it("transfers zero when there are no savings", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(600, "needs")],
    );
    const result = computeRescueTransfer(computed, 0);

    expect(result.transferAmount).toBe(0);
  });

  it("targets wants when only wants is over budget", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(100, "needs"), expense(500, "wants")],
    );
    const result = computeRescueTransfer(computed, 200);

    expect(result.targetEnvelope).toBe("wants");
  });

  it("is non-functional for dependent workers because envelopeSavings is not populated", () => {
    const computed = computeEnvelopesFromData(
      dependentProfile({ monthlyIncome: 1000 }),
      MONTH,
      [],
      [expense(600, "needs")],
    );
    const result = computeRescueTransfer(computed, 0);

    expect(result.transferAmount).toBe(0);
  });

  it("works for independent workers with accumulated savings", () => {
    const computed = computeEnvelopesFromData(
      independentProfile({
        envelopeNeeds: 500,
        envelopeWants: 300,
        envelopeSavings: 200,
      }),
      MONTH,
      [],
      [expense(600, "needs")],
    );
    const result = computeRescueTransfer(computed, 200);

    expect(result.targetEnvelope).toBe("needs");
    expect(result.transferAmount).toBe(100);
  });
});
