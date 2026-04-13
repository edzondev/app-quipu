// __tests__/modules/expenses/schemas/register-expense.schema.test.ts
import { describe, it, expect } from "vitest";
import { registerExpenseSchema } from "@/modules/expenses/schemas/register-expense.schema";

const validInput = {
  amount: 45.5,
  envelope: "needs" as const,
  registeredBy: "user" as const,
};

describe("registerExpenseSchema", () => {
  describe("valid inputs", () => {
    it("accepts a minimal valid expense registered by user", () => {
      expect(registerExpenseSchema.safeParse(validInput).success).toBe(true);
    });

    it("accepts registeredBy: partner", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        registeredBy: "partner",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all three envelope values", () => {
      for (const envelope of ["needs", "wants", "juntos"] as const) {
        const result = registerExpenseSchema.safeParse({
          ...validInput,
          envelope,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts an optional description", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        description: "Almuerzo",
      });
      expect(result.success).toBe(true);
    });

    it("accepts amount as a very small positive number", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        amount: 0.01,
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      const input = {
        amount: 100,
        envelope: "wants" as const,
        registeredBy: "user" as const,
        description: "Netflix",
      };
      expect(registerExpenseSchema.parse(input)).toEqual(input);
    });
  });

  describe("amount validation", () => {
    it("rejects amount of zero (must be positive)", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a negative amount", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        amount: -10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a string amount", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        amount: "cincuenta",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing amount field", () => {
      const { amount: _, ...rest } = validInput;
      expect(registerExpenseSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("envelope validation", () => {
    it("rejects an unknown envelope value", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        envelope: "savings",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing envelope field", () => {
      const { envelope: _, ...rest } = validInput;
      expect(registerExpenseSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("registeredBy validation", () => {
    it("rejects an unknown registeredBy value", () => {
      const result = registerExpenseSchema.safeParse({
        ...validInput,
        registeredBy: "admin",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing registeredBy field", () => {
      const { registeredBy: _, ...rest } = validInput;
      expect(registerExpenseSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(registerExpenseSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(registerExpenseSchema.safeParse({}).success).toBe(false);
    });
  });
});
