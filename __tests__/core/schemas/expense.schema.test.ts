// __tests__/core/schemas/expense.schema.test.ts
import { describe, it, expect } from "vitest";
import { expenseSchema } from "@/core/schemas/expense.schema";

const validExpense = {
  amount: 50,
  envelope: "needs" as const,
};

describe("expenseSchema", () => {
  describe("valid inputs", () => {
    it("accepts a minimal valid expense (amount + envelope)", () => {
      const result = expenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it("accepts all three envelope values", () => {
      for (const envelope of ["needs", "wants", "juntos"] as const) {
        const result = expenseSchema.safeParse({ amount: 10, envelope });
        expect(result.success).toBe(true);
      }
    });

    it("accepts a decimal amount", () => {
      const result = expenseSchema.safeParse({
        amount: 12.75,
        envelope: "wants",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an optional date string", () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        date: "2025-03-15",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an optional description string", () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        description: "Almuerzo de trabajo",
      });
      expect(result.success).toBe(true);
    });

    it("accepts both optional fields together", () => {
      const result = expenseSchema.safeParse({
        amount: 25,
        envelope: "juntos",
        date: "2025-03-15",
        description: "Cena",
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      const result = expenseSchema.parse({
        amount: 100,
        envelope: "needs",
        date: "2025-03-01",
        description: "Luz",
      });
      expect(result).toEqual({
        amount: 100,
        envelope: "needs",
        date: "2025-03-01",
        description: "Luz",
      });
    });
  });

  describe("invalid inputs", () => {
    it("rejects a missing amount", () => {
      const result = expenseSchema.safeParse({ envelope: "needs" });
      expect(result.success).toBe(false);
    });

    it("rejects a string where amount is expected", () => {
      const result = expenseSchema.safeParse({
        amount: "cincuenta",
        envelope: "needs",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing envelope", () => {
      const result = expenseSchema.safeParse({ amount: 50 });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid envelope value", () => {
      const result = expenseSchema.safeParse({
        amount: 50,
        envelope: "savings",
      });
      expect(result.success).toBe(false);
    });

    it("rejects null as the entire input", () => {
      const result = expenseSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("rejects an empty object", () => {
      const result = expenseSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
