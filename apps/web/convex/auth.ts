import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import type { AuthFunctions, GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { isRunMutationCtx } from "@convex-dev/better-auth/utils";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import {
	sendPasswordResetEmail as deliverPasswordResetEmail,
	sendVerificationEmail as deliverVerificationEmail,
	sendOtpEmail,
} from "./lib/email/authMail";
import { assertEmailAllowed } from "./lib/email/domainPolicy";

const siteUrl = process.env.SITE_URL || "http://localhost:3000";
const rpID = process.env.PASSKEY_RP_ID || "localhost";
// Orígenes válidos para verificar credenciales passkey. Android Credential
// Manager firma clientDataJSON con "android:apk-key-hash:<sha256-base64>"
// del certificado de firma (debug y Play signing tienen hashes distintos),
// así que se suman por env separados por coma.
const androidApkKeyHashes = (process.env.PASSKEY_ANDROID_APK_KEY_HASHES ?? "")
	.split(",")
	.map((hash) => hash.trim())
	.filter(Boolean)
	.map((hash) => `android:apk-key-hash:${hash}`);
const passkeyOrigins = [siteUrl, ...androidApkKeyHashes];
const rpName = process.env.PASSKEY_RP_NAME || "quipu";

const emailSchema = z
	.string({ error: "Email is required" })
	.trim()
	.toLowerCase()
	.min(1, "Email is required")
	.pipe(z.email("Email inválido"));
const authFunctions: AuthFunctions = internal.auth;

async function enforceAuthEmailRateLimit(
	ctx: GenericCtx<DataModel>,
	email: string,
	action: "verification" | "password_reset" | "sign_up" | "otp",
): Promise<void> {
	if (!isRunMutationCtx(ctx)) return;
	await ctx.runMutation(internal.lib.authRateLimit.assertAuthRateLimit, {
		email,
		action,
	});
}

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onUpdate: async () => {},
			onDelete: async (ctx, authUser) => {
				const profile = await ctx.db
					.query("profiles")
					.withIndex("by_userId", (q) => q.eq("userId", authUser._id))
					.unique();
				if (!profile) return;
				await ctx.runMutation(internal.profiles.deleteAllDataForProfile, {
					profileId: profile._id,
				});
			},
		},
	},
	local: {
		schema: authSchema,
	},
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: siteUrl,
		// Origen del app móvil: el plugin server expo() copia el header
		// "expo-origin" (que envía expoClient) a "Origin" para el check CSRF.
		trustedOrigins: [siteUrl, "quipu://"],
		database: authComponent.adapter(ctx),
		rateLimit: {
			enabled: true,
			storage: "memory",
			window: 60,
			max: 100,
			customRules: {
				"/sign-in/email": { window: 10, max: 3 },
				"/sign-up/email": { window: 600, max: 3 },
				"/forget-password": { window: 900, max: 3 },
				"/request-password-reset": { window: 900, max: 3 },
				"/send-verification-email": { window: 300, max: 2 },
				"/passkey/*": { window: 60, max: 10 },
				"/email-otp/*": { window: 60, max: 3 },
			},
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: false,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				assertEmailAllowed(user.email);
				await enforceAuthEmailRateLimit(ctx, user.email, "password_reset");
				await deliverPasswordResetEmail({
					to: user.email,
					url,
					name: user.name,
				});
			},
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				assertEmailAllowed(user.email);
				const createdAtMs =
					typeof user.createdAt === "number" ? user.createdAt : new Date(user.createdAt).getTime();
				const isNewSignup = Date.now() - createdAtMs < 5 * 60 * 1000;
				if (isNewSignup) {
					await enforceAuthEmailRateLimit(ctx, user.email, "sign_up");
				}
				await enforceAuthEmailRateLimit(ctx, user.email, "verification");
				await deliverVerificationEmail({
					to: user.email,
					url,
					name: user.name,
				});
			},
		},
		user: {
			deleteUser: { enabled: true },
		},
		plugins: [
			convex({ authConfig }),
			expo(),
			passkey({
				rpName: rpName,
				rpID: rpID,
				origin: passkeyOrigins,
				authenticatorSelection: {
					residentKey: "preferred",
					userVerification: "preferred",
				},
				registration: {
					requireSession: false,
					resolveUser: async ({ context, ctx: passkeyCtx }) => {
						const { success, data: email } = emailSchema.safeParse(context);
						if (!success) throw new Error("Email inválido");
						assertEmailAllowed(email);

						const { internalAdapter } = passkeyCtx.context;
						const found = await internalAdapter.findUserByEmail(email);
						if (found?.user) {
							return {
								id: found.user.id,
								name: found.user.name,
								displayName: email,
							};
						}
						const localPart = email.split("@")[0] ?? email;
						const created = await internalAdapter.createUser({
							email,
							name: localPart.length > 0 ? localPart : email,
							emailVerified: false,
						});
						return { id: created.id, name: created.name, displayName: email };
					},
				},
			}),
			emailOTP({
				otpLength: 6,
				expiresIn: 600,
				allowedAttempts: 3,
				storeOTP: "hashed",
				sendVerificationOTP: async ({ email, otp }) => {
					assertEmailAllowed(email);
					await enforceAuthEmailRateLimit(ctx, email, "otp");
					await sendOtpEmail({ to: email, otp });
				},
			}),
		],
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
