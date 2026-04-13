// __tests__/lib/env.test.ts
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
  getConvexUrl,
  getConvexSiteUrl,
  getSiteUrl,
  getPosthogKey,
  getPosthogHost,
} from "@/lib/env";

// All environment variables touched in this file
const ENV_KEYS = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CONVEX_SITE_URL",
  "SITE_URL",
  "BETTER_AUTH_URL",
  "VERCEL_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
  "NEXT_PUBLIC_POSTHOG_HOST",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

// Snapshot the real values before any test runs
const snapshot: Record<string, string | undefined> = {};
beforeAll(() => {
  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key];
  }
});

// After each test, fully restore the snapshotted values
afterEach(() => {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
});

function setEnv(values: Partial<Record<EnvKey, string>>) {
  for (const key of ENV_KEYS) {
    if (key in values) {
      process.env[key] = values[key as EnvKey];
    } else {
      delete process.env[key];
    }
  }
}

describe("getConvexUrl", () => {
  it("returns the value of NEXT_PUBLIC_CONVEX_URL when set", () => {
    setEnv({ NEXT_PUBLIC_CONVEX_URL: "https://happy-fox-123.convex.cloud" });
    expect(getConvexUrl()).toBe("https://happy-fox-123.convex.cloud");
  });

  it("trims surrounding whitespace from the env value", () => {
    setEnv({ NEXT_PUBLIC_CONVEX_URL: "  https://trimmed.convex.cloud  " });
    expect(getConvexUrl()).toBe("https://trimmed.convex.cloud");
  });

  it("throws when NEXT_PUBLIC_CONVEX_URL is an empty string", () => {
    setEnv({ NEXT_PUBLIC_CONVEX_URL: "" });
    expect(() => getConvexUrl()).toThrow("NEXT_PUBLIC_CONVEX_URL");
  });

  it("throws when NEXT_PUBLIC_CONVEX_URL is whitespace only", () => {
    setEnv({ NEXT_PUBLIC_CONVEX_URL: "   " });
    expect(() => getConvexUrl()).toThrow();
  });

  it("throws when NEXT_PUBLIC_CONVEX_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(() => getConvexUrl()).toThrow();
  });
});

describe("getConvexSiteUrl", () => {
  it("returns the value of NEXT_PUBLIC_CONVEX_SITE_URL when set", () => {
    setEnv({
      NEXT_PUBLIC_CONVEX_SITE_URL: "https://happy-fox-123.convex.site",
    });
    expect(getConvexSiteUrl()).toBe("https://happy-fox-123.convex.site");
  });

  it("trims surrounding whitespace", () => {
    setEnv({
      NEXT_PUBLIC_CONVEX_SITE_URL: "  https://trimmed.convex.site  ",
    });
    expect(getConvexSiteUrl()).toBe("https://trimmed.convex.site");
  });

  it("throws when NEXT_PUBLIC_CONVEX_SITE_URL is an empty string", () => {
    setEnv({ NEXT_PUBLIC_CONVEX_SITE_URL: "" });
    expect(() => getConvexSiteUrl()).toThrow("NEXT_PUBLIC_CONVEX_SITE_URL");
  });

  it("throws when NEXT_PUBLIC_CONVEX_SITE_URL is whitespace only", () => {
    setEnv({ NEXT_PUBLIC_CONVEX_SITE_URL: "   " });
    expect(() => getConvexSiteUrl()).toThrow();
  });

  it("throws when NEXT_PUBLIC_CONVEX_SITE_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    expect(() => getConvexSiteUrl()).toThrow();
  });
});

describe("getSiteUrl", () => {
  it("returns SITE_URL as the first priority", () => {
    setEnv({
      SITE_URL: "https://site-url.example.com",
      BETTER_AUTH_URL: "https://better-auth.example.com",
      VERCEL_URL: "vercel.example.com",
      NEXT_PUBLIC_SITE_URL: "https://next-public.example.com",
    });
    expect(getSiteUrl()).toBe("https://site-url.example.com");
  });

  it("falls back to BETTER_AUTH_URL when SITE_URL is missing", () => {
    setEnv({
      BETTER_AUTH_URL: "https://better-auth.example.com",
    });
    expect(getSiteUrl()).toBe("https://better-auth.example.com");
  });

  it("falls back to VERCEL_URL prefixed with https:// when SITE_URL and BETTER_AUTH_URL are missing", () => {
    setEnv({ VERCEL_URL: "my-app.vercel.app" });
    expect(getSiteUrl()).toBe("https://my-app.vercel.app");
  });

  it("falls back to NEXT_PUBLIC_SITE_URL when all others are missing", () => {
    setEnv({ NEXT_PUBLIC_SITE_URL: "https://next-public.example.com" });
    expect(getSiteUrl()).toBe("https://next-public.example.com");
  });

  it("returns undefined when all fallback env vars are missing", () => {
    setEnv({});
    expect(getSiteUrl()).toBeUndefined();
  });

  it("trims whitespace from the resolved value", () => {
    setEnv({ SITE_URL: "  https://trimmed.example.com  " });
    expect(getSiteUrl()).toBe("https://trimmed.example.com");
  });
});

describe("getPosthogKey", () => {
  it("returns NEXT_PUBLIC_POSTHOG_KEY as the first priority", () => {
    setEnv({
      NEXT_PUBLIC_POSTHOG_KEY: "phc_primary_key",
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_token_key",
    });
    expect(getPosthogKey()).toBe("phc_primary_key");
  });

  it("falls back to NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN when primary key is missing", () => {
    setEnv({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_token_key" });
    expect(getPosthogKey()).toBe("phc_token_key");
  });

  it("returns undefined when both keys are missing", () => {
    setEnv({});
    expect(getPosthogKey()).toBeUndefined();
  });

  it("trims whitespace from the key", () => {
    setEnv({ NEXT_PUBLIC_POSTHOG_KEY: "  phc_trimmed  " });
    expect(getPosthogKey()).toBe("phc_trimmed");
  });
});

describe("getPosthogHost", () => {
  it("returns NEXT_PUBLIC_POSTHOG_HOST when set", () => {
    setEnv({ NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" });
    expect(getPosthogHost()).toBe("https://eu.i.posthog.com");
  });

  it("returns the US cloud default when NEXT_PUBLIC_POSTHOG_HOST is not set", () => {
    setEnv({});
    expect(getPosthogHost()).toBe("https://us.i.posthog.com");
  });

  it("trims whitespace from the host value", () => {
    setEnv({ NEXT_PUBLIC_POSTHOG_HOST: "  https://eu.i.posthog.com  " });
    expect(getPosthogHost()).toBe("https://eu.i.posthog.com");
  });

  it("returns the default when only whitespace is provided", () => {
    setEnv({ NEXT_PUBLIC_POSTHOG_HOST: "   " });
    expect(getPosthogHost()).toBe("https://us.i.posthog.com");
  });
});
