import { passkey } from "@better-auth/passkey";
import type { GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL || "http://localhost:3000";
const rpID = process.env.PASSKEY_RP_ID || "localhost";
const rpName = process.env.PASSKEY_RP_NAME || "Quipu";

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  },
);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    plugins: [
      convex({ authConfig }),
      passkey({
        rpName: rpName,
        rpID: rpID,
        origin: siteUrl,
        registration: {
          requireSession: false,
          resolveUser: async ({ context, ctx }) => {
            const email = String(context ?? "")
              .trim()
              .toLowerCase();
            if (!email.includes("@")) throw new Error("Email inválido");

            const internal = ctx.context.internalAdapter;

            const found = await internal.findUserByEmail(email);
            if (found?.user) {
              return {
                id: found.user.id,
                name: found.user.name,
                displayName: email,
              };
            }
            const created = await internal.createUser({
              email,
              name: email.split("@")[0] ?? email,
              emailVerified: false,
            });
            return { id: created.id, name: created.name, displayName: email };
          },
        },
      }),
    ],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
