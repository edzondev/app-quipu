import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevelopmentDeployment } from "./deployment";

describe("isDevelopmentDeployment", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns true when SITE_URL is localhost (Convex dev runtime)", () => {
		vi.stubEnv("SITE_URL", "http://localhost:3000");
		expect(isDevelopmentDeployment()).toBe(true);
	});

	it("returns true when AUTH_EMAIL_DEV_MODE is set", () => {
		vi.stubEnv("SITE_URL", "https://preview.example.com");
		vi.stubEnv("AUTH_EMAIL_DEV_MODE", "true");
		expect(isDevelopmentDeployment()).toBe(true);
	});

	it("returns true for cloud dev and anonymous local deployments", () => {
		vi.stubEnv("CONVEX_DEPLOYMENT", "dev:perceptive-elk-229");
		expect(isDevelopmentDeployment()).toBe(true);

		vi.stubEnv("CONVEX_DEPLOYMENT", "anonymous:local");
		expect(isDevelopmentDeployment()).toBe(true);
	});

	it("returns false for production-like config", () => {
		vi.stubEnv("SITE_URL", "https://app.quipu.pe");
		vi.stubEnv("CONVEX_DEPLOYMENT", "prod:happy-animal-123");
		expect(isDevelopmentDeployment()).toBe(false);
	});
});
