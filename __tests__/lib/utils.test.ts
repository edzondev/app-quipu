// __tests__/lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn, currentMonthString, todayString } from "@/lib/utils";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves tailwind conflicts — last value wins", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("resolves padding conflicts — last value wins", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("drops falsy values (false, null, undefined)", () => {
    expect(cn("px-2", false, null, undefined, "py-2")).toBe("px-2 py-2");
  });

  it("supports conditional classes via object syntax", () => {
    expect(cn({ "font-bold": true, italic: false })).toBe("font-bold");
  });

  it("supports array syntax", () => {
    expect(cn(["text-sm", "font-medium"])).toBe("text-sm font-medium");
  });

  it("returns empty string when no classes are provided", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("merges responsive modifier classes correctly", () => {
    expect(cn("sm:px-4", "sm:px-8")).toBe("sm:px-8");
  });

  it("keeps non-conflicting utility classes from both arguments", () => {
    const result = cn("text-sm", "font-bold");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-bold");
  });
});

describe("currentMonthString", () => {
  it("returns a string matching YYYY-MM format", () => {
    expect(currentMonthString()).toMatch(/^\d{4}-\d{2}$/);
  });

  it("returns exactly 7 characters", () => {
    expect(currentMonthString()).toHaveLength(7);
  });

  it("contains a hyphen at position 4", () => {
    expect(currentMonthString()[4]).toBe("-");
  });

  it("returns the same value when called twice in rapid succession", () => {
    expect(currentMonthString()).toBe(currentMonthString());
  });

  it("contains a month number between 01 and 12", () => {
    const month = parseInt(currentMonthString().slice(5, 7), 10);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it("contains a plausible year (>= 2024)", () => {
    const year = parseInt(currentMonthString().slice(0, 4), 10);
    expect(year).toBeGreaterThanOrEqual(2024);
  });
});

describe("todayString", () => {
  it("returns a string matching YYYY-MM-DD format", () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns exactly 10 characters", () => {
    expect(todayString()).toHaveLength(10);
  });

  it("has hyphens at positions 4 and 7", () => {
    const s = todayString();
    expect(s[4]).toBe("-");
    expect(s[7]).toBe("-");
  });

  it("returns the same value when called twice in rapid succession", () => {
    expect(todayString()).toBe(todayString());
  });

  it("starts with the current month prefix from currentMonthString", () => {
    expect(todayString().startsWith(currentMonthString())).toBe(true);
  });

  it("contains a day between 01 and 31", () => {
    const day = parseInt(todayString().slice(8, 10), 10);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });
});
