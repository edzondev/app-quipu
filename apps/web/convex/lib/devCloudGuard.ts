import { ConvexError } from "convex/values";

/** Cloud dev deployment. Production is patient-chihuahua-640. */
const DEV_CLOUD_HOST = "perceptive-elk-229.convex.cloud";

export function isDevCloudUrl(cloudUrl: string | undefined): boolean {
	if (cloudUrl === undefined || cloudUrl.length === 0) return false;
	try {
		return new URL(cloudUrl).hostname === DEV_CLOUD_HOST;
	} catch {
		return false;
	}
}

export function assertDevCloudOnly(cloudUrl: string | undefined): void {
	if (isDevCloudUrl(cloudUrl)) return;
	throw new ConvexError({
		code: "FORBIDDEN",
		message: "Solo disponible en el deployment de desarrollo (perceptive-elk-229).",
	});
}
