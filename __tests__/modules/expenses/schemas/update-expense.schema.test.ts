// __tests__/modules/expenses/schemas/update-expense.schema.test.ts
import { describe, it, expect } from "vitest";
import { updateExpenseSchema } from "@/modules/expenses/schemas/update-expense.schema";

const validInput = {
  amount: 75,
  envelope: "wants" as const,
};

describe("updateExpenseSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid amount and envelope", () => {
      expect(updateExpenseSchema.safeParse(validInput).success).toBe(true);
    });

    it("accepts all three envelope values", () => {
      for (const envelope of ["needs", "wants", "juntos"] as const) {
        const result = updateExpenseSchema.safeParse({ ...validInput, envelope });
        expect(result.success).toBe(true);
      }
    });

    it("accepts an optional description", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        description: "Cinema",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a decimal amount", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        amount: 12.99,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a very small positive amount", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        amount: 0.01,
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      const input = {
        amount: 200,
        envelope: "needs" as const,
        description: "Agua",
      };
      expect(updateExpenseSchema.parse(input)).toEqual(input);
    });
  });

  describe("amount validation", () => {
    it("rejects amount of zero (must be positive)", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a negative amount", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        amount: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a string amount", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        amount: "veinte",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing amount field", () => {
      const { amount: _, ...rest } = validInput;
      expect(updateExpenseSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("envelope validation", () => {
    it("rejects an unknown envelope value", () => {
      const result = updateExpenseSchema.safeParse({
        ...validInput,
        envelope: "savings",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing envelope field", () => {
      const { envelope: _, ...rest } = validInput;
      expect(updateExpenseSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(updateExpenseSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(updateExpenseSchema.safeParse({}).success).toBe(false);
    });
  });
});
