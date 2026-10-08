function isLocalHostSiteUrl(url: string): boolean {
	try {
		const { hostname } = new URL(url);
		return hostname === "localhost" || hostname === "127.0.0.1";
	} catch {
		return false;
	}
}

/**
 * Detecta entorno de desarrollo para auth email (consola, sin Resend).
 *
 * `CONVEX_DEPLOYMENT` solo existe en el CLI local, no en funciones Convex.
 * En runtime usamos `SITE_URL` localhost y/o `AUTH_EMAIL_DEV_MODE=true`.
 */
export function isDevelopmentDeployment(): boolean {
	if (process.env.AUTH_EMAIL_DEV_MODE === "true") return true;

	const siteUrl = process.env.SITE_URL ?? "";
	if (isLocalHostSiteUrl(siteUrl)) return true;

	const deployment = process.env.CONVEX_DEPLOYMENT ?? "";
	return deployment.startsWith("dev:") || deployment.startsWith("anonymous:");
}
