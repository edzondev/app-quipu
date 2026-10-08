import { MINUTE } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { assertEmailAllowed } from "./email/domainPolicy";
import { assertEmailSendCooldown, recordEmailSend } from "./email/emailSendLog";
import { authRateLimiter } from "./rateLimit";

const authActionValidator = v.union(
	v.literal("sign_up"),
	v.literal("verification"),
	v.literal("password_reset"),
	v.literal("otp"),
);

export const assertAuthRateLimit = internalMutation({
	args: {
		email: v.string(),
		action: authActionValidator,
		ipKey: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const email = args.email.trim().toLowerCase();
		assertEmailAllowed(email);

		if (args.action === "sign_up") {
			await authRateLimiter.limit(ctx, "authSignUpByEmail", {
				key: email,
				throws: true,
			});
			if (args.ipKey) {
				await authRateLimiter.limit(ctx, "authSignUpByIp", {
					key: args.ipKey,
					throws: true,
				});
			}
			return null;
		}

		if (args.action === "verification") {
			await assertEmailSendCooldown(ctx, email, "verification");
			await authRateLimiter.limit(ctx, "authEmailVerification", {
				key: email,
				throws: true,
			});
			await recordEmailSend(ctx, email, "verification");
			return null;
		}

		if (args.action === "password_reset") {
			await assertEmailSendCooldown(ctx, email, "password_reset");
			await authRateLimiter.limit(ctx, "authPasswordReset", {
				key: email,
				throws: true,
			});
			await recordEmailSend(ctx, email, "password_reset");
			return null;
		}

		if (args.action === "otp") {
			// Bucket propio por email (mismos límites que "verification"): no puede
			// compartir bucket ni cooldown con "verification" porque el alta de
			// cuenta dispara sendVerificationEmail segundos antes del OTP del wizard.
			await authRateLimiter.limit(ctx, "authEmailOtp", {
				key: email,
				throws: true,
				config: {
					kind: "token bucket",
					rate: 2,
					period: 5 * MINUTE,
					capacity: 1,
				},
			});
			return null;
		}

		throw new ConvexError("Unknown auth rate limit action");
	},
});
