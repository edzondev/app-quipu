import { Polar } from "@convex-dev/polar";
import { action } from "./_generated/server";
import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { checkoutsCreate } from "@polar-sh/sdk/funcs/checkoutsCreate.js";

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
      premium: process.env.POLAR_PRODUCT_ID_PREMIUM!,
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

// Convenience action — bypasses the component's customer cache by calling the
// Polar API directly with customerEmail. This avoids "Customer does not exist"
// errors caused by stale customerId entries in the polar component's DB.
export const createPremiumCheckout = action({
  args: {
    origin: v.string(),
    successUrl: v.string(),
  },
  handler: async (ctx, { origin, successUrl }) => {
    const productId = process.env.POLAR_PRODUCT_ID_PREMIUM;
    if (!productId) throw new Error("POLAR_PRODUCT_ID_PREMIUM not set");

    const { userId, email } = await ctx.runQuery(
      internal.users.getCurrentUserInfo,
    );

    const polarClient = new PolarCore({
      accessToken: process.env.POLAR_ORGANIZATION_TOKEN!,
      server:
        (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
    });

    // Use customerEmail (not customerId) to avoid stale component customer cache
    const checkout = await checkoutsCreate(polarClient, {
      customerEmail: email,
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
