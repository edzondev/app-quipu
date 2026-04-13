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

polar.registerRoutes(http, {
  path: "/webhooks/polar",

  onSubscriptionCreated: async (ctx, event) => {
    const { id: polarSubscriptionId, customerId: polarCustomerId } = event.data;

    // Primary: userId embedded in checkout metadata by createPremiumCheckout
    // Fallback: externalId or customer metadata (for manual Polar dashboard subscriptions)
    // The Polar SDK types don't expose metadata/customer fields directly, so we extend the type.
    type PolarSubscriptionExtras = {
      metadata?: Record<string, string | undefined>;
      customer?: {
        externalId?: string;
        metadata?: Record<string, string | undefined>;
      };
    };
    const data = event.data as typeof event.data & PolarSubscriptionExtras;
    const userId =
      data.metadata?.userId ??
      data.customer?.externalId ??
      data.customer?.metadata?.userId;

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
    if (status === "revoked" || status === "canceled") {
      await ctx.runMutation(internal.subscriptions.revokePremium, {
        polarSubscriptionId,
      });
    }
  },
});

export default http;
