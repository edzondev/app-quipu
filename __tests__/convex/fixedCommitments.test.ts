// @ts-nocheck
import { describe, expect, it, type vi } from "vitest";
import { createAuthenticatedMockMutationCtx } from "@/__tests__/fixtures/ctx";
import {
  commitment,
  dependentProfile,
  profileId,
} from "@/__tests__/fixtures/financial";
import type { Id } from "@/convex/_generated/dataModel";

describe("createFixedCommitment", () => {
  it("allows premium users to create commitments", async () => {
    const { createFixedCommitment } = await import("@/convex/fixedCommitments");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
    });

    await createFixedCommitment(ctx, {
      name: "Rent",
      amount: 1000,
      envelope: "needs",
    });

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "fixedCommitments",
      expect.objectContaining({
        profileId,
        name: "Rent",
        amount: 1000,
        envelope: "needs",
      }),
    );
  });

  it("rejects free users", async () => {
    const { createFixedCommitment } = await import("@/convex/fixedCommitments");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "free" }),
    });

    await expect(
      createFixedCommitment(ctx, {
        name: "Rent",
        amount: 1000,
        envelope: "needs",
      }),
    ).rejects.toThrow("This feature requires a premium plan");
  });

  it("rejects non-positive amounts", async () => {
    const { createFixedCommitment } = await import("@/convex/fixedCommitments");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
    });

    await expect(
      createFixedCommitment(ctx, {
        name: "Rent",
        amount: 0,
        envelope: "needs",
      }),
    ).rejects.toThrow("Amount must be greater than 0");
  });
});

describe("deleteFixedCommitment", () => {
  it("allows premium users to delete their commitments", async () => {
    const { deleteFixedCommitment } = await import("@/convex/fixedCommitments");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
    });

    (ctx.db.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      commitment(1000, "needs"),
    );

    await deleteFixedCommitment(ctx, {
      commitmentId: "commitment-id" as Id<"fixedCommitments">,
    });

    expect(ctx.db.delete).toHaveBeenCalled();
  });

  it("rejects free users", async () => {
    const { deleteFixedCommitment } = await import("@/convex/fixedCommitments");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "free" }),
    });

    (ctx.db.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      commitment(1000, "needs"),
    );

    await expect(
      deleteFixedCommitment(ctx, {
        commitmentId: "commitment-id" as Id<"fixedCommitments">,
      }),
    ).rejects.toThrow("This feature requires a premium plan");
  });

  it("rejects deleting another user's commitment", async () => {
    const { deleteFixedCommitment } = await import("@/convex/fixedCommitments");
    const ctx = createAuthenticatedMockMutationCtx("user_123", {
      profiles: dependentProfile({ userId: "user_123", plan: "premium" }),
    });

    (ctx.db.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...commitment(1000, "needs"),
      profileId: "other-profile-id" as Id<"profiles">,
    });

    await expect(
      deleteFixedCommitment(ctx, {
        commitmentId: "commitment-id" as Id<"fixedCommitments">,
      }),
    ).rejects.toThrow("Fixed commitment not found");
  });
});
