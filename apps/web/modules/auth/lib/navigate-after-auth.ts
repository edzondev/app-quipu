"use client";

/**
 * Post sign-in/sign-up navigation must include session cookies on the next
 * document request. Client `router.push` can race Set-Cookie and leave RSC
 * gates (`requireOnboardedProfile`) without a session.
 */
export function navigateAfterAuth(href: string): void {
	window.location.assign(href);
}
