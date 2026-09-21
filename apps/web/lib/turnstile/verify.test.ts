import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TurnstileMisconfiguredError } from "./config";
import {
  authPathRequiresTurnstile,
  enforceAuthTurnstile,
  verifyTurnstileToken,
} from "./verify";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe("authPathRequiresTurnstile", () => {
  it("requires Turnstile on email/password auth posts", () => {
    expect(authPathRequiresTurnstile("/api/auth/sign-in/email")).toBe(true);
    expect(authPathRequiresTurnstile("/api/auth/sign-up/email")).toBe(true);
    expect(authPathRequiresTurnstile("/api/auth/request-password-reset")).toBe(
      true,
    );
    expect(authPathRequiresTurnstile("/api/auth/forget-password")).toBe(true);
    expect(authPathRequiresTurnstile("/api/auth/send-verification-email")).toBe(
      true,
    );
  });

  it("requires Turnstile on passkey sign-in (same catch-all as /sign-in)", () => {
    expect(authPathRequiresTurnstile("/api/auth/sign-in/passkey")).toBe(true);
  });

  it("does not require Turnstile on passkey registration or session helpers", () => {
    expect(
      authPathRequiresTurnstile("/api/auth/passkey/generate-register-options"),
    ).toBe(false);
    expect(authPathRequiresTurnstile("/api/auth/get-session")).toBe(false);
  });
});

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws when verification is expected but the secret is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    await expect(verifyTurnstileToken("token-1")).rejects.toBeInstanceOf(
      TurnstileMisconfiguredError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not silently succeed in development without a secret", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    await expect(verifyTurnstileToken("token-1")).rejects.toThrow(
      /TURNSTILE_SECRET_KEY/,
    );
  });

  it("returns false when the token is empty", async () => {
    await expect(verifyTurnstileToken("")).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts to siteverify and returns Cloudflare success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, hostname: "localhost" }) as Response,
    );

    await expect(verifyTurnstileToken("tok", "1.1.1.1")).resolves.toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      SITEVERIFY_URL,
      expect.objectContaining({ method: "POST" }),
    );
    const body = vi.mocked(fetch).mock.calls[0]?.[1]?.body;
    expect(String(body)).toContain("response=tok");
    expect(String(body)).toContain("remoteip=1.1.1.1");
  });

  it("returns false when siteverify rejects the token", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      }) as Response,
    );

    await expect(verifyTurnstileToken("used-token")).resolves.toBe(false);
  });

  it("rejects a hostname outside the allowlist when configured", async () => {
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "quipu-finance.app,localhost");
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, hostname: "evil.test" }) as Response,
    );

    await expect(verifyTurnstileToken("tok")).resolves.toBe(false);
  });

  it("accepts a hostname on the allowlist", async () => {
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "localhost");
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, hostname: "localhost" }) as Response,
    );

    await expect(verifyTurnstileToken("tok")).resolves.toBe(true);
  });
});

describe("enforceAuthTurnstile", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("skips paths that do not require Turnstile", async () => {
    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/get-session",
        token: null,
      }),
    ).resolves.toEqual({ blocked: false });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("skips when Turnstile is not configured (no site key)", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/sign-in/email",
        token: null,
      }),
    ).resolves.toEqual({ blocked: false });
  });

  it("returns 503 when Turnstile is enabled but the secret is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/sign-in/email",
        token: "tok",
      }),
    ).resolves.toEqual({
      blocked: true,
      status: 503,
      error: "captcha_misconfigured",
    });
  });

  it("returns 400 when the token header is missing", async () => {
    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/sign-in/passkey",
        token: null,
      }),
    ).resolves.toEqual({
      blocked: true,
      status: 400,
      error: "Verification required",
    });
  });

  it("returns 403 when siteverify fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false }) as Response,
    );

    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/sign-in/email",
        token: "bad",
      }),
    ).resolves.toEqual({
      blocked: true,
      status: 403,
      error: "Verification failed",
    });
  });

  it("allows the request when siteverify succeeds", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true }) as Response,
    );

    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/sign-in/passkey",
        token: "ok-token",
      }),
    ).resolves.toEqual({ blocked: false });
  });

  it("skips passkey sign-in when a session cookie is already present (in-session reauth)", async () => {
    await expect(
      enforceAuthTurnstile({
        pathname: "/api/auth/sign-in/passkey",
        token: null,
        cookieHeader: "better-auth.session_token=abc",
      }),
    ).resolves.toEqual({ blocked: false });
    expect(fetch).not.toHaveBeenCalled();
  });
});
