import { Polar } from "@convex-dev/polar";
import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { checkoutsCreate } from "@polar-sh/sdk/funcs/checkoutsCreate.js";
import { customerSessionsCreate } from "@polar-sh/sdk/funcs/customerSessionsCreate.js";
import { customersUpdate } from "@polar-sh/sdk/funcs/customersUpdate.js";
import {
  getPolarProductIdPremium,
  requirePolarOrganizationToken,
} from "./runtimeEnv";

// ─── Polar Client ─────────────────────────────────────────────────────────────
// Reads from Convex env vars:
//   POLAR_ORGANIZATION_TOKEN  → your Polar org/personal access token
//   POLAR_WEBHOOK_SECRET      → from the Polar dashboard webhook config
//   POLAR_SERVER              → "sandbox" | "production"
//   POLAR_PRODUCT_ID_PREMIUM  → product ID from your Polar dashboard

export const polar: Polar<DataModel, { premium: string }> = new Polar(
  components.polar,
  {
    // getUserInfo ctx is RunQueryCtx — only has runQuery, no ctx.auth.
    // We delegate to an internalQuery where ctx.auth IS available.
    getUserInfo: async (ctx) => {
      return await ctx.runQuery(internal.users.getCurrentUserInfo);
    },

    // Map your internal plan keys to Polar product IDs.
    // Add more entries here as you create new products in Polar.
    products: {
      premium: getPolarProductIdPremium() ?? "",
    },

    // Remaining config falls back to env vars:
    //   organizationToken → POLAR_ORGANIZATION_TOKEN
    //   webhookSecret     → POLAR_WEBHOOK_SECRET
    //   server            → POLAR_SERVER
  },
);

// ─── Exported Convex Functions ────────────────────────────────────────────────
// Call these from your frontend via useAction / useQuery.
//
//   generateCheckoutLink      → action → returns a Polar checkout URL
//   generateCustomerPortalUrl → action → returns the Polar customer portal URL
//   getConfiguredProducts     → action → returns products defined above
//   listAllProducts           → action → returns all products from Polar API
//   cancelCurrentSubscription → action → cancels the user's active subscription
//   changeCurrentSubscription → action → switches between plans

export const {
  generateCheckoutLink,
  generateCustomerPortalUrl,
  getConfiguredProducts,
  listAllProducts,
  cancelCurrentSubscription,
  changeCurrentSubscription,
} = polar.api();

// Convenience action — creates a Polar customer portal session without relying
// on the component's stale customer cache.
//
// Strategy (in order):
//   1. Try externalCustomerId = userId (works if the customer was created with
//      externalCustomerId set, i.e. checkouts after this fix was deployed).
//   2. Fall back to the polarCustomerId stored in our profile (works for
//      existing customers created before the externalCustomerId fix).
//      Also backfills externalCustomerId on the Polar customer so future
//      calls use path #1.
export const createCustomerPortalSession = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const { userId } = await ctx.runQuery(internal.users.getCurrentUserInfo);
    const planData = await ctx.runQuery(
      internal.subscriptions.getMyPlanInternal,
    );

    const rawServer1 = process.env.POLAR_SERVER ?? "sandbox";
    const polarClient = new PolarCore({
      accessToken: requirePolarOrganizationToken(),
      server: rawServer1 === "production" ? "production" : "sandbox",
    });

    // ── Path 1: externalCustomerId (preferred, no cache issues) ────────────
    const byExternal = await customerSessionsCreate(polarClient, {
      externalCustomerId: userId,
    });

    if (byExternal.ok) {
      return byExternal.value.customerPortalUrl;
    }

    // ── Path 2: fall back to polarCustomerId stored in our profile ──────────
    const polarCustomerId = planData?.polarCustomerId;
    if (!polarCustomerId) {
      throw new ConvexError(
        "No se encontró una suscripción activa. Completa tu primer pago para acceder al portal.",
      );
    }

    const byId = await customerSessionsCreate(polarClient, {
      customerId: polarCustomerId,
    });

    if (!byId.ok) throw byId.error;

    // Backfill externalCustomerId on the Polar customer so path #1 works next time
    try {
      await customersUpdate(polarClient, {
        id: polarCustomerId,
        customerUpdate: { externalId: userId },
      });
    } catch (err) {
      console.error("Failed to backfill Polar externalCustomerId:", err);
    }

    return byId.value.customerPortalUrl;
  },
});

// Convenience action — bypasses the component's customer cache by calling the
// Polar API directly with customerEmail. This avoids "Customer does not exist"
// errors caused by stale customerId entries in the polar component's DB.
export const createPremiumCheckout = action({
  args: {
    origin: v.string(),
    successUrl: v.string(),
  },
  handler: async (ctx, { origin, successUrl }) => {
    const productId = getPolarProductIdPremium();
    if (!productId) throw new ConvexError("POLAR_PRODUCT_ID_PREMIUM not set");

    const { userId, email } = await ctx.runQuery(
      internal.users.getCurrentUserInfo,
    );

    const rawServer2 = process.env.POLAR_SERVER ?? "sandbox";
    const polarClient = new PolarCore({
      accessToken: requirePolarOrganizationToken(),
      server: rawServer2 === "production" ? "production" : "sandbox",
    });

    // Pass both customerEmail and externalCustomerId so Polar links the customer
    // to our userId from the start — this makes the portal session work reliably
    // via externalCustomerId without depending on the component's internal cache.
    const checkout = await checkoutsCreate(polarClient, {
      customerEmail: email,
      externalCustomerId: userId,
      products: [productId],
      embedOrigin: origin,
      successUrl,
      metadata: { userId },
      allowDiscountCodes: true,
    });

    if (!checkout.ok) throw checkout.error;
    return checkout.value.url;
  },
});
