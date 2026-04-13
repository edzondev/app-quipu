// __tests__/modules/auth/schemas/login.schema.test.ts
import { describe, it, expect } from "vitest";
import { loginSchema } from "@/modules/auth/schemas/login.schema";

describe("loginSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid email and non-empty password", () => {
      const result = loginSchema.safeParse({
        email: "usuario@ejemplo.com",
        password: "secreto123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a single-character password (min is 1)", () => {
      const result = loginSchema.safeParse({
        email: "a@b.com",
        password: "x",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a password with special characters", () => {
      const result = loginSchema.safeParse({
        email: "a@b.com",
        password: "P@ssw0rd!#",
      });
      expect(result.success).toBe(true);
    });

    it("parses and returns the correct shape", () => {
      const input = { email: "test@quipu.app", password: "abc123" };
      const result = loginSchema.parse(input);
      expect(result).toEqual(input);
    });
  });

  describe("invalid email", () => {
    it("rejects a missing @ sign", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an email without a domain", () => {
      const result = loginSchema.safeParse({
        email: "user@",
        password: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an empty email string", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a number in place of email", () => {
      const result = loginSchema.safeParse({
        email: 12345,
        password: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing email field", () => {
      const result = loginSchema.safeParse({ password: "abc" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid password", () => {
    it("rejects an empty string password", () => {
      const result = loginSchema.safeParse({
        email: "a@b.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing password field", () => {
      const result = loginSchema.safeParse({ email: "a@b.com" });
      expect(result.success).toBe(false);
    });

    it("rejects a number in place of password", () => {
      const result = loginSchema.safeParse({
        email: "a@b.com",
        password: 123,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid shape", () => {
    it("rejects null", () => {
      expect(loginSchema.safeParse(null).success).toBe(false);
    });

    it("rejects an empty object", () => {
      expect(loginSchema.safeParse({}).success).toBe(false);
    });
  });
});
