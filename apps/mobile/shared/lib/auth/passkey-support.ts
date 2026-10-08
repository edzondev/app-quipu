function majorVersion(version: string | number | undefined): number | null {
	if (typeof version === "number" && Number.isFinite(version)) return Math.trunc(version);
	if (typeof version !== "string" || version.length === 0) return null;
	const parsed = Number.parseInt(version, 10);
	return Number.isFinite(parsed) ? parsed : null;
}

/** iOS 16+ y Android 9+ (API 28). Sin versión legible, se intenta la ceremonia. */
export function platformAdmitsPasskeys(os: string, version: string | number | undefined): boolean {
	const major = majorVersion(version);
	if (os === "ios") return major == null || major >= 16;
	if (os === "android") return major == null || major >= 28;
	return false;
}
