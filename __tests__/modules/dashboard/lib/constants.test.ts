// __tests__/modules/dashboard/lib/constants.test.ts
import { describe, it, expect } from "vitest";
import { fmt, BADGE_CLASS, ENVELOPE_LABEL } from "@/modules/dashboard/lib/constants";

describe("fmt", () => {
  describe("positive integers", () => {
    it("formats an integer amount with the Sol symbol", () => {
      expect(fmt(100, "S/")).toBe("S/ 100");
    });

    it("formats an integer amount with the Dollar symbol", () => {
      expect(fmt(50, "$")).toBe("$ 50");
    });

    it("formats a large integer without decimal places", () => {
      expect(fmt(10000, "S/")).toBe("S/ 10000");
    });

    it("formats 1 (boundary) as integer", () => {
      expect(fmt(1, "S/")).toBe("S/ 1");
    });
  });

  describe("positive decimals", () => {
    it("formats a decimal amount to 2 decimal places", () => {
      expect(fmt(100.5, "S/")).toBe("S/ 100.50");
    });

    it("formats a value with 2 significant decimal digits", () => {
      expect(fmt(99.99, "$")).toBe("$ 99.99");
    });

    it("formats a value with one trailing zero", () => {
      expect(fmt(1.1, "S/")).toBe("S/ 1.10");
    });

    it("treats 1.0 as an integer (no decimal point)", () => {
      expect(fmt(1.0, "S/")).toBe("S/ 1");
    });
  });

  describe("zero", () => {
    it("formats zero as an integer without sign", () => {
      expect(fmt(0, "S/")).toBe("S/ 0");
    });

    it("formats zero with Dollar symbol", () => {
      expect(fmt(0, "$")).toBe("$ 0");
    });
  });

  describe("negative values", () => {
    it("prepends a minus sign before the symbol for negative integers", () => {
      expect(fmt(-50, "S/")).toBe("-S/ 50");
    });

    it("prepends a minus sign before the symbol for negative decimals", () => {
      expect(fmt(-50.75, "S/")).toBe("-S/ 50.75");
    });

    it("formats a negative value to 2 decimal places", () => {
      expect(fmt(-1.1, "$")).toBe("-$ 1.10");
    });

    it("formats -1 (boundary) as integer with minus", () => {
      expect(fmt(-1, "S/")).toBe("-S/ 1");
    });

    it("uses the absolute value for the numeric portion", () => {
      const result = fmt(-200, "S/");
      expect(result).toContain("200");
      expect(result.startsWith("-")).toBe(true);
    });
  });

  describe("various currency symbols", () => {
    it("works with a multi-character symbol", () => {
      expect(fmt(100, "US$")).toBe("US$ 100");
    });

    it("works with an empty symbol string", () => {
      expect(fmt(42, "")).toBe(" 42");
    });
  });
});

describe("BADGE_CLASS", () => {
  it("defines a class for needs envelope", () => {
    expect(BADGE_CLASS.needs).toBeTypeOf("string");
    expect(BADGE_CLASS.needs.length).toBeGreaterThan(0);
  });

  it("defines a class for wants envelope", () => {
    expect(BADGE_CLASS.wants).toBeTypeOf("string");
    expect(BADGE_CLASS.wants.length).toBeGreaterThan(0);
  });

  it("defines a class for juntos envelope", () => {
    expect(BADGE_CLASS.juntos).toBeTypeOf("string");
    expect(BADGE_CLASS.juntos.length).toBeGreaterThan(0);
  });

  it("assigns different classes to each envelope", () => {
    expect(BADGE_CLASS.needs).not.toBe(BADGE_CLASS.wants);
    expect(BADGE_CLASS.needs).not.toBe(BADGE_CLASS.juntos);
    expect(BADGE_CLASS.wants).not.toBe(BADGE_CLASS.juntos);
  });
});

describe("ENVELOPE_LABEL", () => {
  it("maps needs to the Spanish label", () => {
    expect(ENVELOPE_LABEL.needs).toBe("Necesidades");
  });

  it("maps wants to the Spanish label", () => {
    expect(ENVELOPE_LABEL.wants).toBe("Gustos");
  });

  it("maps juntos to the Spanish label", () => {
    expect(ENVELOPE_LABEL.juntos).toBe("Juntos");
  });
});
