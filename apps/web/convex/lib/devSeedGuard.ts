import { ConvexError } from "convex/values";
import { assertDevCloudOnly } from "./devCloudGuard";

/**
 * Seed is allowed only when both are true:
 * - `ALLOW_DEV_SEED` is exactly `"true"` (unset on production; must be set on dev)
 * - `CONVEX_CLOUD_URL` is the dev deployment host (platform-injected, not a client arg)
 */
export function assertDevSeedAllowed(env: {
	allowDevSeed: string | undefined;
	cloudUrl: string | undefined;
}): void {
	if (env.allowDevSeed !== "true") {
		throw new ConvexError({
			code: "FORBIDDEN",
			message: "ALLOW_DEV_SEED no está habilitado.",
		});
	}
	assertDevCloudOnly(env.cloudUrl);
}
