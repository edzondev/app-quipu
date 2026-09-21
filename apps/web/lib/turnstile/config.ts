export class TurnstileMisconfiguredError extends Error {
  constructor(message = "TURNSTILE_SECRET_KEY missing") {
    super(message);
    this.name = "TurnstileMisconfiguredError";
  }
}

/**
 * Turnstile is on when a site key is configured. Local/dev should use
 * Cloudflare dummy keys — never skip siteverify just because NODE_ENV is
 * development.
 */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export function getTurnstileSecretKey(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY || undefined;
}

export function getTurnstileAllowedHostnames(): string[] {
  const raw = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
