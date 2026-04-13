// __tests__/modules/auth/schemas/register.schema.test.ts
import { describe, it, expect } from "vitest";
import { registerSchema } from "@/modules/auth/schemas/register.schema";

// A password that satisfies all policy rules:
// at least 6 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char (@$!%*?&)
const VALID_PASSWORD = "Secret1@";

describe("registerSchema", () => {
  describe("valid inputs", () => {
    it("accepts a full name, valid email and policy-compliant password", () => {
      const result = registerSchema.safeParse({
        fullName: "Ana García",
        email: "ana@quipu.app",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a full name with a single word (min 1 char)", () => {
      const result = registerSchema.safeParse({
        fullName: "A",
        email: "a@b.com",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      const input = {
        fullName: "Test User",
        email: "test@quipu.app",
        password: VALID_PASSWORD,
      };
      const result = registerSchema.parse(input);
      expect(result).toEqual(input);
    });
  });

  describe("fullName validation", () => {
    it("rejects an empty full name", () => {
      const result = registerSchema.safeParse({
        fullName: "",
        email: "a@b.com",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing fullName field", () => {
      const result = registerSchema.safeParse({
        email: "a@b.com",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("email validation", () => {
    it("rejects an invalid email format", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "not-an-email",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(false);
    });

    it("rejects an email without a domain TLD", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "user@",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing email field", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        password: VALID_PASSWORD,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("password policy", () => {
    it("rejects a password shorter than 6 characters", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "Ab1@",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a password without an uppercase letter", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "secret1@",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a password without a lowercase letter", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "SECRET1@",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a password without a digit", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "SecretAB@",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a password without a special character", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "Secret123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an all-lowercase password with no special chars or digits", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "password",
      });
      expect(result.success).toBe(false);
    });

    it("accepts a password at exact 6 characters meeting all policy rules", () => {
      // exactly 6: upper + lower + digit + special
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "a@b.com",
        password: "Ab1@xy",
      });
      expect(result.success).toBe(true);
    });

    it("accepts each of the allowed special characters", () => {
      for (const special of ["@", "$", "!", "%", "*", "?", "&"]) {
        const result = registerSchema.safeParse({
          fullName: "Test",
          email: "a@b.com",
          password: `Abc123${special}`,
        });
        expect(result.success).toBe(
          true,
          `expected success for special char: ${special}`,
        );
      }
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(registerSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(registerSchema.safeParse({}).success).toBe(false);
    });
  });
});
