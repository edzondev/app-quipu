import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import { Polar as PolarSDK } from "@polar-sh/sdk";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
);

// ─── Polar SDK Client ─────────────────────────────────────────────────────────
// Reads POLAR_ORGANIZATION_TOKEN and POLAR_SERVER from Convex env vars.
// (Better Auth routes run inside Convex HTTP actions via @convex-dev/better-auth)
const polarSDKClient = new PolarSDK({
  accessToken: process.env.POLAR_ORGANIZATION_TOKEN,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
});

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "app-quipu",
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        fullName: { type: "string" },
      },
    },
    plugins: [
      convex({ authConfig }),
      // ─── Polar Plugin ────────────────────────────────────────────────────
      // Adds these routes to Better Auth (proxied via /api/auth/...):
      //   GET /api/auth/polar/checkout/:slug  → creates checkout & redirects
      //   GET /api/auth/polar/portal          → redirects to customer portal
      //
      // Usage in frontend:
      //   router.push("/api/auth/polar/checkout/premium")
      //   router.push("/api/auth/polar/portal")
      polar({
        client: polarSDKClient,
        // Don't auto-create Polar customers on signup (avoids schema changes)
        createCustomerOnSignUp: false,
        use: [
          checkout({
            // Map slugs → Polar product IDs (set POLAR_PRODUCT_ID_PREMIUM in Convex env)
            products: [
              {
                productId: process.env.POLAR_PRODUCT_ID_PREMIUM!,
                slug: "premium",
              },
            ],
            // Where to redirect after a successful checkout
            successUrl: "/settings?upgraded=true",
            // Only authenticated users can start a checkout
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
        ],
      }),
    ],
  } satisfies BetterAuthOptions;
};

// For `auth` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
