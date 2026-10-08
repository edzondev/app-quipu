import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/** Límites distribuidos para auth y emails transaccionales. */
export const authRateLimiter = new RateLimiter(components.rateLimiter, {
	authSignUpByEmail: {
		kind: "fixed window",
		rate: 3,
		period: HOUR,
	},
	authSignUpByIp: {
		kind: "fixed window",
		rate: 5,
		period: HOUR,
	},
	authEmailVerification: {
		kind: "token bucket",
		rate: 2,
		period: 5 * MINUTE,
		capacity: 1,
	},
	authPasswordReset: {
		kind: "token bucket",
		rate: 3,
		period: 15 * MINUTE,
		capacity: 1,
	},
	feedbackSubmit: {
		kind: "fixed window",
		rate: 5,
		period: HOUR,
	},
});
