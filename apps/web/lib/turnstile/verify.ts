import {
  getTurnstileAllowedHostnames,
  getTurnstileSecretKey,
  isTurnstileEnabled,
  TurnstileMisconfiguredError,
} from "./config";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const TURNSTILE_AUTH_PATH_MARKERS = [
  "/sign-up/email",
  "/sign-in/email",
  // Public passkey sign-in hits the same catch-all as password sign-in.
  // Send x-cf-turnstile-token from the sign-in widget. In-session reauth
  // (settings delete-account) is skipped when a session cookie is present.
  "/sign-in/passkey",
  "/request-password-reset",
  "/forget-password",
  "/send-verification-email",
] as const;

type TurnstileVerifyResponse = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export type TurnstileGuardResult =
  | { blocked: false }
  | { blocked: true; status: 400 | 403 | 503; error: string };

export function authPathRequiresTurnstile(pathname: string): boolean {
  return TURNSTILE_AUTH_PATH_MARKERS.some((marker) =>
    pathname.includes(marker),
  );
}

export function hasSessionCookie(
  cookieHeader: string | null | undefined,
): boolean {
  if (!cookieHeader) return false;
  return /(?:^|;\s*)[^=]*session_token=/.test(cookieHeader);
}

function hostnameAllowed(hostname: string | undefined): boolean {
  const allowed = getTurnstileAllowedHostnames();
  if (allowed.length === 0) return true;
  if (!hostname) return false;
  return allowed.includes(hostname);
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string | null,
): Promise<boolean> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    throw new TurnstileMisconfiguredError();
  }
  if (!token) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;
  const data = (await response.json()) as TurnstileVerifyResponse;
  if (data.success !== true) return false;
  return hostnameAllowed(data.hostname);
}

export async function enforceAuthTurnstile(args: {
  pathname: string;
  token: string | null;
  remoteIp?: string | null;
  cookieHeader?: string | null;
}): Promise<TurnstileGuardResult> {
  if (!authPathRequiresTurnstile(args.pathname)) {
    return { blocked: false };
  }

  // Passkey registration lives under /passkey/* (not covered). Public
  // passkey *sign-in* is POST /sign-in/passkey and requires Turnstile.
  // Settings delete-account reauth uses the same path with an existing
  // session cookie and has no widget — WebAuthn is enough there.
  if (
    args.pathname.includes("/sign-in/passkey") &&
    hasSessionCookie(args.cookieHeader)
  ) {
    return { blocked: false };
  }

  if (!isTurnstileEnabled()) {
    return { blocked: false };
  }

  if (!args.token) {
    return {
      blocked: true,
      status: 400,
      error: "Verification required",
    };
  }

  try {
    const valid = await verifyTurnstileToken(args.token, args.remoteIp);
    if (!valid) {
      return {
        blocked: true,
        status: 403,
        error: "Verification failed",
      };
    }
    return { blocked: false };
  } catch (error) {
    if (error instanceof TurnstileMisconfiguredError) {
      return {
        blocked: true,
        status: 503,
        error: "captcha_misconfigured",
      };
    }
    throw error;
  }
}
