import { afterEach, describe, expect, it, vi } from "vitest";
import { authFetchOptions, requireTurnstileToken } from "./auth-fetch-options";

describe("authFetchOptions", () => {
  it("sends the Turnstile token header when a token exists", () => {
    expect(authFetchOptions("tok-1")).toEqual({
      headers: { "x-cf-turnstile-token": "tok-1" },
    });
  });

  it("omits headers when the token is missing", () => {
    expect(authFetchOptions(null)).toEqual({});
  });
});

describe("requireTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a token when Turnstile is enabled via site key", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");

    expect(requireTurnstileToken(null, "1x00000000000000000000AA")).toBe(false);
    expect(requireTurnstileToken("tok", "1x00000000000000000000AA")).toBe(true);
  });

  it("does not skip the requirement just because NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");

    expect(requireTurnstileToken(null, "1x00000000000000000000AA")).toBe(false);
  });

  it("allows submit when no site key is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    expect(requireTurnstileToken(null, undefined)).toBe(true);
  });
});
