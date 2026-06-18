import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./betterAuth/auth";
import { polar } from "./polar";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

// ─── Polar Webhooks ───────────────────────────────────────────────────────────
// @convex-dev/polar handles signature verification automatically.
// The webhook URL to configure in Polar dashboard:
//   {NEXT_PUBLIC_CONVEX_SITE_URL}/webhooks/polar
//
// Required Convex env vars (npx convex env set <KEY> <VALUE>):
//   POLAR_ORGANIZATION_TOKEN
//   POLAR_WEBHOOK_SECRET
//   POLAR_SERVER              ("sandbox" | "production")
//   POLAR_PRODUCT_ID_PREMIUM

export type PolarSubscriptionExtras = {
  id: string;
  customerId: string;
  status: string;
  metadata?: Record<string, string | undefined>;
  customer?: {
    externalId?: string;
    metadata?: Record<string, string | undefined>;
  };
};

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

/**
 * Pure decision helper: returns true when a subscription status should trigger
 * premium revocation.
 */
export function shouldRevokePremium(status: string): boolean {
  return !ACTIVE_SUBSCRIPTION_STATUSES.includes(status);
}

/**
 * Pure helper: extracts the userId from Polar subscription webhook payload.
 */
export function extractUserIdFromSubscriptionEvent(
  data: PolarSubscriptionExtras,
): string | undefined {
  return (
    data.metadata?.userId ??
    data.customer?.externalId ??
    data.customer?.metadata?.userId
  );
}

polar.registerRoutes(http, {
  path: "/webhooks/polar",

  onSubscriptionCreated: async (ctx, event) => {
    const { id: polarSubscriptionId, customerId: polarCustomerId } = event.data;

    // Primary: userId embedded in checkout metadata by createPremiumCheckout
    // Fallback: externalId or customer metadata (for manual Polar dashboard subscriptions)
    // The Polar SDK types don't expose metadata/customer fields directly, so we extend the type.
    const data = event.data as typeof event.data & PolarSubscriptionExtras;
    const userId = extractUserIdFromSubscriptionEvent(data);

    if (userId) {
      await ctx.runMutation(internal.subscriptions.linkPolarCustomer, {
        userId,
        polarCustomerId,
        polarSubscriptionId,
      });
    } else {
      // Fallback: activate by customerId (e.g. manual subscription in dashboard)
      await ctx.runMutation(internal.subscriptions.activatePremium, {
        polarCustomerId,
        polarSubscriptionId,
      });
    }
  },

  onSubscriptionUpdated: async (ctx, event) => {
    const { id: polarSubscriptionId, status } = event.data;
    // Revoke premium if the subscription is no longer active
    if (shouldRevokePremium(status)) {
      await ctx.runMutation(internal.subscriptions.revokePremium, {
        polarSubscriptionId,
      });
    }
  },
});

export default http;
