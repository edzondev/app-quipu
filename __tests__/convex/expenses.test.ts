// @ts-nocheck
import { describe, expect, it } from "vitest";
import { createAuthenticatedMockMutationCtx } from "@/__tests__/fixtures/ctx";
import {
  dependentProfile,
  expense,
  profileId,
} from "@/__tests__/fixtures/financial";

describe("registerExpense", () => {
  it("rejects non-positive amounts", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123" }),
    });

    await expect(
      registerExpense(ctx, { amount: 0, envelope: "needs" }),
    ).rejects.toThrow("Amount must be greater than 0");
  });

  it("allows premium users to register unlimited expenses", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
      expenses: [],
      achievements: [],
    });

    await registerExpense(ctx, { amount: 50, envelope: "needs" });

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "expenses",
      expect.objectContaining({
        profileId,
        amount: 50,
        envelope: "needs",
      }),
    );
  });

  it("rejects the 21st expense for free users", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const existing = Array.from({ length: 20 }, (_, i) =>
      expense(10, "needs", `2026-06-${String(i + 1).padStart(2, "0")}`),
    );
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "free" }),
      expenses: existing,
      achievements: [],
    });

    await expect(
      registerExpense(ctx, { amount: 10, envelope: "needs" }),
    ).rejects.toThrow("Free plan limit: 20 expenses per month");
  });

  it("rejects juntos envelope when couple mode is disabled", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({
        userId: "user_123",
        coupleModeEnabled: false,
      }),
      expenses: [],
      achievements: [],
    });

    await expect(
      registerExpense(ctx, { amount: 50, envelope: "juntos" }),
    ).rejects.toThrow("Couple mode is not enabled");
  });

  it("allows juntos envelope when couple mode is enabled", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({
        userId: "user_123",
        coupleModeEnabled: true,
        plan: "premium",
      }),
      expenses: [],
      achievements: [],
    });

    await registerExpense(ctx, { amount: 50, envelope: "juntos" });

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "expenses",
      expect.objectContaining({ envelope: "juntos" }),
    );
  });

  it("rejects registeredBy partner when couple mode is disabled", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({
        userId: "user_123",
        coupleModeEnabled: false,
      }),
      expenses: [],
      achievements: [],
    });

    await expect(
      registerExpense(ctx, {
        amount: 50,
        envelope: "needs",
        registeredBy: "partner",
      }),
    ).rejects.toThrow("Couple mode is not enabled");
  });

  it("allows large amounts", async () => {
    const { registerExpense } = await import("@/convex/expenses");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
      expenses: [],
      achievements: [],
    });

    await registerExpense(ctx, { amount: 1_000_000, envelope: "needs" });

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "expenses",
      expect.objectContaining({ amount: 1_000_000 }),
    );
  });
});
