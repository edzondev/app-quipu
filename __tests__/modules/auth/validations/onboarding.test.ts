// __tests__/modules/auth/validations/onboarding.test.ts
import { describe, it, expect } from "vitest";
import {
  stepTwoSchema,
  stepWorkerTypeSchema,
  stepThreeSchema,
  stepFourSchema,
  onboardingSchema,
} from "@/modules/auth/validations/onboarding";

// ─── stepTwoSchema ─────────────────────────────────────────────────────────────

describe("stepTwoSchema", () => {
  const validStepTwo = {
    name: "Ana García",
    country: "Peru",
    currencyCode: "PEN",
    currencySymbol: "S/",
    currencyName: "Sol peruano",
    currencyLocale: "es-PE",
  };

  it("accepts a complete, valid profile step", () => {
    expect(stepTwoSchema.safeParse(validStepTwo).success).toBe(true);
  });

  it("parses and returns the correct shape", () => {
    expect(stepTwoSchema.parse(validStepTwo)).toEqual(validStepTwo);
  });

  it("rejects an empty name", () => {
    const result = stepTwoSchema.safeParse({ ...validStepTwo, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty country", () => {
    const result = stepTwoSchema.safeParse({ ...validStepTwo, country: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty currencyCode", () => {
    const result = stepTwoSchema.safeParse({
      ...validStepTwo,
      currencyCode: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field (currencySymbol)", () => {
    const { currencySymbol: _, ...rest } = validStepTwo;
    const result = stepTwoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty object", () => {
    expect(stepTwoSchema.safeParse({}).success).toBe(false);
  });
});

// ─── stepWorkerTypeSchema ──────────────────────────────────────────────────────

describe("stepWorkerTypeSchema", () => {
  it("accepts 'dependent' worker type", () => {
    expect(
      stepWorkerTypeSchema.safeParse({ workerType: "dependent" }).success,
    ).toBe(true);
  });

  it("accepts 'independent' worker type", () => {
    expect(
      stepWorkerTypeSchema.safeParse({ workerType: "independent" }).success,
    ).toBe(true);
  });

  it("rejects an unknown worker type string", () => {
    expect(
      stepWorkerTypeSchema.safeParse({ workerType: "freelance" }).success,
    ).toBe(false);
  });

  it("rejects a missing workerType field", () => {
    expect(stepWorkerTypeSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(
      stepWorkerTypeSchema.safeParse({ workerType: "" }).success,
    ).toBe(false);
  });
});

// ─── stepThreeSchema ──────────────────────────────────────────────────────────

describe("stepThreeSchema", () => {
  const validDependent = {
    workerType: "dependent" as const,
    monthlyIncome: 3000,
  };

  describe("valid inputs", () => {
    it("accepts a dependent worker with monthly income only", () => {
      expect(stepThreeSchema.safeParse(validDependent).success).toBe(true);
    });

    it("accepts an independent worker", () => {
      expect(
        stepThreeSchema.safeParse({
          workerType: "independent",
          monthlyIncome: 5000,
        }).success,
      ).toBe(true);
    });

    it("accepts initialRemainingBudget equal to monthlyIncome", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        initialRemainingBudget: 3000,
      });
      expect(result.success).toBe(true);
    });

    it("accepts initialRemainingBudget less than monthlyIncome", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        initialRemainingBudget: 1500,
      });
      expect(result.success).toBe(true);
    });

    it("accepts initialRemainingBudget of zero", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        initialRemainingBudget: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional paydays array", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        payFrequency: "biweekly",
        paydays: [1, 15],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects a missing monthlyIncome", () => {
      const result = stepThreeSchema.safeParse({ workerType: "dependent" });
      expect(result.success).toBe(false);
    });

    it("rejects monthlyIncome of zero (must be positive)", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        monthlyIncome: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a negative monthlyIncome", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        monthlyIncome: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects initialRemainingBudget that exceeds monthlyIncome (refine)", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        monthlyIncome: 1000,
        initialRemainingBudget: 1500,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a negative initialRemainingBudget", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        initialRemainingBudget: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a payday day greater than 31", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        paydays: [32],
      });
      expect(result.success).toBe(false);
    });

    it("rejects a payday day of zero", () => {
      const result = stepThreeSchema.safeParse({
        ...validDependent,
        paydays: [0],
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─── stepFourSchema ───────────────────────────────────────────────────────────

describe("stepFourSchema", () => {
  const validFour = {
    allocationNeeds: 50,
    allocationWants: 30,
    allocationSavings: 20,
  };

  describe("valid inputs", () => {
    it("accepts allocations that sum to exactly 100", () => {
      expect(stepFourSchema.safeParse(validFour).success).toBe(true);
    });

    it("accepts 1 + 1 + 98 = 100", () => {
      expect(
        stepFourSchema.safeParse({
          allocationNeeds: 1,
          allocationWants: 1,
          allocationSavings: 98,
        }).success,
      ).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects allocations summing to less than 100", () => {
      const result = stepFourSchema.safeParse({
        allocationNeeds: 40,
        allocationWants: 30,
        allocationSavings: 20,
      });
      expect(result.success).toBe(false);
    });

    it("rejects allocations summing to more than 100", () => {
      const result = stepFourSchema.safeParse({
        allocationNeeds: 50,
        allocationWants: 30,
        allocationSavings: 30,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero allocation (must be positive)", () => {
      const result = stepFourSchema.safeParse({
        allocationNeeds: 0,
        allocationWants: 50,
        allocationSavings: 50,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer allocation values", () => {
      const result = stepFourSchema.safeParse({
        allocationNeeds: 33.3,
        allocationWants: 33.3,
        allocationSavings: 33.4,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing allocationSavings field", () => {
      const { allocationSavings: _, ...rest } = validFour;
      expect(stepFourSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(stepFourSchema.safeParse({}).success).toBe(false);
    });
  });
});

// ─── onboardingSchema ─────────────────────────────────────────────────────────

describe("onboardingSchema", () => {
  const validOnboarding = {
    name: "Ana García",
    country: "Peru",
    currencyCode: "PEN",
    currencySymbol: "S/",
    currencyName: "Sol peruano",
    currencyLocale: "es-PE",
    workerType: "dependent" as const,
    monthlyIncome: 3000,
    allocationNeeds: 50,
    allocationWants: 30,
    allocationSavings: 20,
  };

  describe("valid inputs", () => {
    it("accepts a complete, valid onboarding payload", () => {
      expect(onboardingSchema.safeParse(validOnboarding).success).toBe(true);
    });

    it("accepts an independent worker type", () => {
      expect(
        onboardingSchema.safeParse({
          ...validOnboarding,
          workerType: "independent",
        }).success,
      ).toBe(true);
    });

    it("accepts optional initialRemainingBudget when it is below monthlyIncome", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        initialRemainingBudget: 1500,
      });
      expect(result.success).toBe(true);
    });

    it("accepts initialRemainingBudget equal to monthlyIncome", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        initialRemainingBudget: 3000,
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape for required fields", () => {
      const result = onboardingSchema.parse(validOnboarding);
      expect(result.name).toBe("Ana García");
      expect(result.allocationNeeds).toBe(50);
      expect(result.allocationWants).toBe(30);
      expect(result.allocationSavings).toBe(20);
    });
  });

  describe("allocation sum refine", () => {
    it("rejects when allocations sum to 99", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        allocationNeeds: 49,
        allocationWants: 30,
        allocationSavings: 20,
      });
      expect(result.success).toBe(false);
    });

    it("rejects when allocations sum to 101", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        allocationNeeds: 51,
        allocationWants: 30,
        allocationSavings: 20,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("initialRemainingBudget refine", () => {
    it("rejects when initialRemainingBudget exceeds monthlyIncome", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        monthlyIncome: 1000,
        initialRemainingBudget: 1500,
      });
      expect(result.success).toBe(false);
    });

    it("accepts when initialRemainingBudget is undefined (optional field)", () => {
      const { initialRemainingBudget: _, ...rest } = {
        ...validOnboarding,
        initialRemainingBudget: undefined,
      };
      expect(onboardingSchema.safeParse(validOnboarding).success).toBe(true);
    });
  });

  describe("name validation", () => {
    it("rejects a name shorter than 2 characters", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        name: "A",
      });
      expect(result.success).toBe(false);
    });

    it("accepts a name with exactly 2 characters", () => {
      const result = onboardingSchema.safeParse({
        ...validOnboarding,
        name: "AB",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(onboardingSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(onboardingSchema.safeParse({}).success).toBe(false);
    });

    it("rejects a missing required monthlyIncome field", () => {
      const { monthlyIncome: _, ...rest } = validOnboarding;
      expect(onboardingSchema.safeParse(rest).success).toBe(false);
    });
  });
});
