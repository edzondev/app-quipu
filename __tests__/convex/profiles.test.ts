// @ts-nocheck
import { describe, expect, it } from "vitest";
import { createAuthenticatedMockMutationCtx } from "@/__tests__/fixtures/ctx";
import { dependentProfile, profileId } from "@/__tests__/fixtures/financial";

describe("createProfile", () => {
  it("creates a profile when none exists", async () => {
    const { createProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: null,
    });

    await createProfile(ctx, {
      name: "Test",
      country: "PE",
      currencyCode: "PEN",
      currencySymbol: "S/",
      currencyName: "Sol Peruano",
      currencyLocale: "es-PE",
      workerType: "dependent",
      payFrequency: "monthly",
      paydays: [15],
      monthlyIncome: 3000,
    });

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "profiles",
      expect.objectContaining({
        userId: "user_123",
        monthlyIncome: 3000,
        plan: "free",
      }),
    );
  });

  it("patches onboardingComplete when profile already exists", async () => {
    const { createProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123" }),
    });

    await createProfile(ctx, {
      name: "Test",
      country: "PE",
      currencyCode: "PEN",
      currencySymbol: "S/",
      currencyName: "Sol Peruano",
      currencyLocale: "es-PE",
      workerType: "dependent",
      payFrequency: "monthly",
      paydays: [15],
      monthlyIncome: 3000,
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(profileId, {
      onboardingComplete: true,
    });
  });

  it("rejects negative monthlyIncome", async () => {
    const { createProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: null,
    });

    await expect(
      createProfile(ctx, {
        name: "Test",
        country: "PE",
        currencyCode: "PEN",
        currencySymbol: "S/",
        currencyName: "Sol Peruano",
        currencyLocale: "es-PE",
        workerType: "dependent",
        payFrequency: "monthly",
        paydays: [15],
        monthlyIncome: -100,
      }),
    ).rejects.toThrow("Monthly income cannot be negative");
  });
});

describe("updateProfile", () => {
  it("allows premium users to enable couple mode", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
    });

    await updateProfile(ctx, {
      coupleModeEnabled: true,
      couplePartnerName: "Partner",
      coupleMonthlyBudget: 1000,
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(
      profileId,
      expect.objectContaining({
        coupleModeEnabled: true,
        couplePartnerName: "Partner",
        coupleMonthlyBudget: 1000,
      }),
    );
  });

  it("rejects enabling couple mode for free users", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "free" }),
    });

    await expect(
      updateProfile(ctx, { coupleModeEnabled: true }),
    ).rejects.toThrow("This feature requires a premium plan");
  });

  it("accepts allocations that sum to 100", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123" }),
    });

    await updateProfile(ctx, {
      allocationNeeds: 60,
      allocationWants: 30,
      allocationSavings: 10,
    });

    expect(ctx.db.patch).toHaveBeenCalled();
  });

  it("rejects allocations that do not sum to 100", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123" }),
    });

    await expect(
      updateProfile(ctx, {
        allocationNeeds: 60,
        allocationWants: 30,
        allocationSavings: 20,
      }),
    ).rejects.toThrow("Allocations must sum to 100%");
  });

  it("rejects partial allocation update that breaks the 100% sum", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({
        userId: "user_123",
        allocationNeeds: 50,
        allocationWants: 30,
        allocationSavings: 20,
      }),
    });

    await expect(updateProfile(ctx, { allocationNeeds: 80 })).rejects.toThrow(
      "Allocations must sum to 100%",
    );
  });

  it("rejects negative coupleMonthlyBudget", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
    });

    await expect(
      updateProfile(ctx, { coupleMonthlyBudget: -500 }),
    ).rejects.toThrow("Couple budget cannot be negative");
  });

  it("rejects negative monthlyIncome", async () => {
    const { updateProfile } = await import("@/convex/profiles");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123" }),
    });

    await expect(updateProfile(ctx, { monthlyIncome: -100 })).rejects.toThrow(
      "Monthly income cannot be negative",
    );
  });
});
