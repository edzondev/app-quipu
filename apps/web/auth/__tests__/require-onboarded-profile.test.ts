import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
	throw new Error(`REDIRECT:${url}`);
});

const isAuthenticatedMock = vi.fn<() => Promise<boolean>>();
const fetchAuthQueryMock = vi.fn();

vi.mock("next/navigation", () => ({
	redirect: (url: string) => redirectMock(url),
}));

vi.mock("@convex-dev/better-auth/nextjs", () => ({
	convexBetterAuthNextJs: () => ({
		handler: vi.fn(),
		preloadAuthQuery: vi.fn(),
		isAuthenticated: isAuthenticatedMock,
		getToken: vi.fn(),
		fetchAuthQuery: fetchAuthQueryMock,
		fetchAuthMutation: vi.fn(),
		fetchAuthAction: vi.fn(),
	}),
}));

vi.mock("@/core/env.client", () => ({
	clientEnv: {
		NEXT_PUBLIC_APP_URL: "http://localhost:3000",
		NEXT_PUBLIC_CONVEX_URL: "https://convex.test",
		NEXT_PUBLIC_CONVEX_SITE_URL: "https://convex-site.test",
	},
}));

describe("requireOnboardedProfile", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("redirects to sign-in when not authenticated", async () => {
		isAuthenticatedMock.mockResolvedValue(false);

		const { requireOnboardedProfile } = await import("@/auth/auth-server");

		await expect(requireOnboardedProfile()).rejects.toThrow("REDIRECT:/sign-in");
		expect(fetchAuthQueryMock).not.toHaveBeenCalled();
	});

	it("redirects to onboarding when profile is missing", async () => {
		isAuthenticatedMock.mockResolvedValue(true);
		fetchAuthQueryMock.mockResolvedValue(null);

		const { requireOnboardedProfile } = await import("@/auth/auth-server");

		await expect(requireOnboardedProfile()).rejects.toThrow("REDIRECT:/onboarding");
	});

	it("returns profile when authenticated and onboarded", async () => {
		isAuthenticatedMock.mockResolvedValue(true);
		const profile = {
			_id: "profiles:test" as const,
			_creationTime: 0,
			userId: "user-1",
			name: "Test",
			plan: "free" as const,
		};
		fetchAuthQueryMock.mockResolvedValue(profile);

		const { requireOnboardedProfile } = await import("@/auth/auth-server");

		await expect(requireOnboardedProfile()).resolves.toEqual(profile);
	});
});
