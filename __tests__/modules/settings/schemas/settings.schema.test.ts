// __tests__/modules/settings/schemas/settings.schema.test.ts
import { describe, it, expect } from "vitest";
import { settingsSchema } from "@/modules/settings/schemas/settings.schema";

const validSettings = {
  monthlyIncome: 3000,
  payFrequency: "monthly" as const,
  allocationNeeds: 50,
  allocationWants: 30,
  allocationSavings: 20,
  coupleModeEnabled: false,
};

describe("settingsSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid settings object with coupleModeEnabled false", () => {
      expect(settingsSchema.safeParse(validSettings).success).toBe(true);
    });

    it("accepts biweekly payFrequency", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        payFrequency: "biweekly",
      });
      expect(result.success).toBe(true);
    });

    it("accepts coupleModeEnabled true with a valid partner name", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleModeEnabled: true,
        couplePartnerName: "Carlos",
        coupleMonthlyBudget: 500,
      });
      expect(result.success).toBe(true);
    });

    it("accepts partner name with exactly 2 characters (boundary)", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleModeEnabled: true,
        couplePartnerName: "AB",
      });
      expect(result.success).toBe(true);
    });

    it("accepts zero monthlyIncome (min is 0)", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        monthlyIncome: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional coupleMonthlyBudget when couple mode disabled", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleMonthlyBudget: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      const result = settingsSchema.parse(validSettings);
      expect(result.allocationNeeds).toBe(50);
      expect(result.allocationWants).toBe(30);
      expect(result.allocationSavings).toBe(20);
    });
  });

  describe("allocation sum refine (must equal 100)", () => {
    it("rejects allocations summing to 99", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        allocationNeeds: 49,
        allocationWants: 30,
        allocationSavings: 20,
      });
      expect(result.success).toBe(false);
    });

    it("rejects allocations summing to 101", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        allocationNeeds: 51,
        allocationWants: 30,
        allocationSavings: 20,
      });
      expect(result.success).toBe(false);
    });

    it("rejects all-zero allocations (sum = 0)", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        allocationNeeds: 0,
        allocationWants: 0,
        allocationSavings: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("couple mode refine (partner name required when enabled)", () => {
    it("rejects coupleModeEnabled true with no partner name", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleModeEnabled: true,
        couplePartnerName: undefined,
      });
      expect(result.success).toBe(false);
    });

    it("rejects coupleModeEnabled true with a partner name shorter than 2 chars", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleModeEnabled: true,
        couplePartnerName: "A",
      });
      expect(result.success).toBe(false);
    });

    it("rejects coupleModeEnabled true with an empty partner name", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleModeEnabled: true,
        couplePartnerName: "",
      });
      expect(result.success).toBe(false);
    });

    it("does not require partner name when coupleModeEnabled is false", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        coupleModeEnabled: false,
        couplePartnerName: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("monthlyIncome validation", () => {
    it("rejects a negative monthlyIncome", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        monthlyIncome: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a string monthlyIncome", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        monthlyIncome: "tres mil",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing monthlyIncome field", () => {
      const { monthlyIncome: _, ...rest } = validSettings;
      expect(settingsSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("payFrequency validation", () => {
    it("rejects an unknown pay frequency", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        payFrequency: "weekly",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing payFrequency field", () => {
      const { payFrequency: _, ...rest } = validSettings;
      expect(settingsSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("allocation field bounds", () => {
    it("rejects allocationNeeds above 100", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        allocationNeeds: 101,
        allocationWants: 0,
        allocationSavings: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects allocationWants below 0", () => {
      const result = settingsSchema.safeParse({
        ...validSettings,
        allocationNeeds: 101,
        allocationWants: -1,
        allocationSavings: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(settingsSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(settingsSchema.safeParse({}).success).toBe(false);
    });
  });
});
