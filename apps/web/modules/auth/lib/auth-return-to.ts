/**
 * Post-auth redirect target. Only same-origin relative paths are allowed
 * to prevent open redirects.
 */
export function sanitizeAuthReturnTo(value: string | null | undefined): string | null {
	if (!value) return null;
	if (!value.startsWith("/")) return null;
	if (value.startsWith("//")) return null;
	if (value.includes("\\")) return null;
	return value;
}

export function resolveAuthDestination(
	returnTo: string | null | undefined,
	fallback: string,
): string {
	return sanitizeAuthReturnTo(returnTo) ?? fallback;
}

export function appendAuthReturnTo(basePath: string, returnTo: string | null | undefined): string {
	const safe = sanitizeAuthReturnTo(returnTo);
	if (!safe) return basePath;
	const separator = basePath.includes("?") ? "&" : "?";
	return `${basePath}${separator}next=${encodeURIComponent(safe)}`;
}
