// __tests__/modules/profile/schemas/profile.schema.test.ts
import { describe, it, expect } from "vitest";
import { profileSchema } from "@/modules/profile/schemas/profile.schema";

const validProfile = {
  name: "Ana García",
  country: "Peru",
  currencyCode: "PEN",
  currencySymbol: "S/",
  currencyName: "Sol peruano",
  currencyLocale: "es-PE",
};

describe("profileSchema", () => {
  describe("valid inputs", () => {
    it("accepts a complete, valid profile", () => {
      expect(profileSchema.safeParse(validProfile).success).toBe(true);
    });

    it("accepts a name with exactly 2 characters (boundary)", () => {
      const result = profileSchema.safeParse({ ...validProfile, name: "AB" });
      expect(result.success).toBe(true);
    });

    it("accepts a country with exactly 1 character (boundary)", () => {
      const result = profileSchema.safeParse({ ...validProfile, country: "X" });
      expect(result.success).toBe(true);
    });

    it("accepts empty string for optional-like currency fields (no min constraint)", () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        currencyCode: "",
        currencySymbol: "",
        currencyName: "",
        currencyLocale: "",
      });
      // currencyCode, symbol, name, locale use z.string() with no min — empty string is valid
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      expect(profileSchema.parse(validProfile)).toEqual(validProfile);
    });
  });

  describe("name validation", () => {
    it("rejects a name shorter than 2 characters", () => {
      const result = profileSchema.safeParse({ ...validProfile, name: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty name", () => {
      const result = profileSchema.safeParse({ ...validProfile, name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing name field", () => {
      const { name: _, ...rest } = validProfile;
      expect(profileSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("country validation", () => {
    it("rejects an empty country string", () => {
      const result = profileSchema.safeParse({ ...validProfile, country: "" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing country field", () => {
      const { country: _, ...rest } = validProfile;
      expect(profileSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(profileSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(profileSchema.safeParse({}).success).toBe(false);
    });

    it("rejects a non-string value for name", () => {
      const result = profileSchema.safeParse({ ...validProfile, name: 123 });
      expect(result.success).toBe(false);
    });
  });
});
