// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  asMutationHandler,
  createMockMutationCtx,
} from "@/__tests__/fixtures/ctx";
import { profileId } from "@/__tests__/fixtures/financial";
import {
  extractUserIdFromSubscriptionEvent,
  shouldRevokePremium,
} from "@/convex/http";

describe("shouldRevokePremium", () => {
  it("returns false for active statuses", () => {
    expect(shouldRevokePremium("active")).toBe(false);
    expect(shouldRevokePremium("trialing")).toBe(false);
  });

  it("returns true for revoked and canceled statuses", () => {
    expect(shouldRevokePremium("revoked")).toBe(true);
    expect(shouldRevokePremium("canceled")).toBe(true);
  });

  it("returns true for inactive/past_due/unpaid statuses", () => {
    expect(shouldRevokePremium("inactive")).toBe(true);
    expect(shouldRevokePremium("past_due")).toBe(true);
    expect(shouldRevokePremium("unpaid")).toBe(true);
    expect(shouldRevokePremium("expired")).toBe(true);
    expect(shouldRevokePremium("paused")).toBe(true);
  });
});

describe("extractUserIdFromSubscriptionEvent", () => {
  it("extracts userId from metadata first", () => {
    const data = {
      id: "sub_123",
      customerId: "cus_123",
      status: "active",
      metadata: { userId: "user_abc" },
    };
    expect(extractUserIdFromSubscriptionEvent(data)).toBe("user_abc");
  });

  it("falls back to customer.externalId", () => {
    const data = {
      id: "sub_123",
      customerId: "cus_123",
      status: "active",
      customer: { externalId: "user_def" },
    };
    expect(extractUserIdFromSubscriptionEvent(data)).toBe("user_def");
  });

  it("falls back to customer.metadata.userId", () => {
    const data = {
      id: "sub_123",
      customerId: "cus_123",
      status: "active",
      customer: { metadata: { userId: "user_ghi" } },
    };
    expect(extractUserIdFromSubscriptionEvent(data)).toBe("user_ghi");
  });

  it("returns undefined when no userId is present", () => {
    const data = {
      id: "sub_123",
      customerId: "cus_123",
      status: "active",
    };
    expect(extractUserIdFromSubscriptionEvent(data)).toBeUndefined();
  });

  it("prefers metadata userId over customer externalId", () => {
    const data = {
      id: "sub_123",
      customerId: "cus_123",
      status: "active",
      metadata: { userId: "from_metadata" },
      customer: { externalId: "from_external" },
    };
    expect(extractUserIdFromSubscriptionEvent(data)).toBe("from_metadata");
  });
});

describe("subscription mutations (with mocked ctx)", () => {
  it("activatePremium upgrades the profile by polarCustomerId", async () => {
    const { activatePremium } = await import("@/convex/subscriptions");
    const profile = {
      _id: profileId,
      userId: "user_123",
      plan: "free" as const,
      polarCustomerId: "cus_123",
    };
    const ctx = createMockMutationCtx({
      profiles: profile,
    });

    await asMutationHandler<
      { polarCustomerId: string; polarSubscriptionId: string },
      null
    >(activatePremium)(ctx, {
      polarCustomerId: "cus_123",
      polarSubscriptionId: "sub_123",
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(profileId, {
      plan: "premium",
      polarSubscriptionId: "sub_123",
      planActivatedAt: expect.any(Number),
    });
  });

  it("activatePremium is a no-op when no profile matches the customerId", async () => {
    const { activatePremium } = await import("@/convex/subscriptions");
    const ctx = createMockMutationCtx({ profiles: null });

    const result = await activatePremium(ctx, {
      polarCustomerId: "cus_unknown",
      polarSubscriptionId: "sub_123",
    });

    expect(result).toBeNull();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it("revokePremium downgrades the profile by polarSubscriptionId", async () => {
    const { revokePremium } = await import("@/convex/subscriptions");
    const profile = {
      _id: profileId,
      userId: "user_123",
      plan: "premium" as const,
      polarSubscriptionId: "sub_123",
    };
    const ctx = createMockMutationCtx({ profiles: profile });

    await revokePremium(ctx, { polarSubscriptionId: "sub_123" });

    expect(ctx.db.patch).toHaveBeenCalledWith(profileId, {
      plan: "free",
      polarSubscriptionId: undefined,
      polarCustomerId: undefined,
      planActivatedAt: undefined,
    });
  });

  it("revokePremium clears Polar fields when downgrading", async () => {
    const { revokePremium } = await import("@/convex/subscriptions");
    const profile = {
      _id: profileId,
      userId: "user_123",
      plan: "premium" as const,
      polarSubscriptionId: "sub_123",
      polarCustomerId: "cus_123",
      planActivatedAt: 1_700_000_000_000,
    };
    const ctx = createMockMutationCtx({ profiles: profile });

    await revokePremium(ctx, { polarSubscriptionId: "sub_123" });

    expect(ctx.db.patch).toHaveBeenCalledWith(profileId, {
      plan: "free",
      polarSubscriptionId: undefined,
      polarCustomerId: undefined,
      planActivatedAt: undefined,
    });
  });

  it("revokePremium is a no-op when no profile matches the subscriptionId", async () => {
    const { revokePremium } = await import("@/convex/subscriptions");
    const ctx = createMockMutationCtx({ profiles: null });

    const result = await revokePremium(ctx, {
      polarSubscriptionId: "sub_unknown",
    });

    expect(result).toBeNull();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it("linkPolarCustomer links customer and activates premium", async () => {
    const { linkPolarCustomer } = await import("@/convex/subscriptions");
    const profile = {
      _id: profileId,
      userId: "user_123",
      plan: "free" as const,
    };
    const ctx = createMockMutationCtx({ profiles: profile });

    await linkPolarCustomer(ctx, {
      userId: "user_123",
      polarCustomerId: "cus_123",
      polarSubscriptionId: "sub_123",
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(profileId, {
      plan: "premium",
      polarCustomerId: "cus_123",
      polarSubscriptionId: "sub_123",
      planActivatedAt: expect.any(Number),
    });
  });

  it("linkPolarCustomer is a no-op when no profile matches the userId", async () => {
    const { linkPolarCustomer } = await import("@/convex/subscriptions");
    const ctx = createMockMutationCtx({ profiles: null });

    const result = await linkPolarCustomer(ctx, {
      userId: "user_unknown",
      polarCustomerId: "cus_123",
      polarSubscriptionId: "sub_123",
    });

    expect(result).toBeNull();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
});
