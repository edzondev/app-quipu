import { afterEach, describe, expect, it, vi } from "vitest";
import { isTurnstileEnabled } from "./config";

describe("isTurnstileEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is enabled in development when a site key is set (dummy keys, no NODE_ENV skip)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");

    expect(isTurnstileEnabled()).toBe(true);
  });

  it("is disabled when no site key is configured, even outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    expect(isTurnstileEnabled()).toBe(false);
  });

  it("is enabled in production when a site key is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "prod-site-key");

    expect(isTurnstileEnabled()).toBe(true);
  });
});
