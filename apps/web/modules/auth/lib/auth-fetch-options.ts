import { isTurnstileEnabled } from "@/lib/turnstile/config";

export function authFetchOptions(turnstileToken: string | null) {
	if (!turnstileToken) return {};
	return {
		headers: {
			"x-cf-turnstile-token": turnstileToken,
		},
	} as const;
}

export function requireTurnstileToken(turnstileToken: string | null, siteKey?: string): boolean {
	if (!isTurnstileEnabled() || !siteKey) return true;
	return Boolean(turnstileToken);
}
