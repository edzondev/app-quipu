// __tests__/convex/helpers.test.ts
import { describe, it, expect } from "vitest";
import {
  requirePremium,
  currentMonthString,
  todayString,
} from "@/convex/helpers";

// NOTE: getProfile, getProfileOrThrow, getAuthUserIdOrThrow, computeEnvelopes,
// and distributeSavingsToSubEnvelopes all require a live Convex ctx.db and are
// therefore tested via integration tests only. This file covers the three pure
// exports that have no I/O dependencies.

describe("requirePremium", () => {
  it("does not throw when plan is premium", () => {
    expect(() => requirePremium("premium")).not.toThrow();
  });

  it("throws when plan is free", () => {
    expect(() => requirePremium("free")).toThrow();
  });

  it("throws an error with the premium-required message for free plan", () => {
    expect(() => requirePremium("free")).toThrow(
      "This feature requires a premium plan",
    );
  });
});

describe("currentMonthString (convex/helpers)", () => {
  it("returns a string matching YYYY-MM format", () => {
    expect(currentMonthString()).toMatch(/^\d{4}-\d{2}$/);
  });

  it("returns exactly 7 characters", () => {
    expect(currentMonthString()).toHaveLength(7);
  });

  it("contains a hyphen at position 4", () => {
    expect(currentMonthString()[4]).toBe("-");
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

describe("todayString (convex/helpers)", () => {
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

  it("starts with the value returned by currentMonthString", () => {
    expect(todayString().startsWith(currentMonthString())).toBe(true);
  });

  it("contains a day between 01 and 31", () => {
    const day = parseInt(todayString().slice(8, 10), 10);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });
});
