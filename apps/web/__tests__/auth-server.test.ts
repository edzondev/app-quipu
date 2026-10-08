import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Doc } from "@/convex/_generated/dataModel";

const mockRedirect = vi.fn<(url: string) => never>();
const mockIsAuthenticated = vi.fn<() => Promise<boolean>>();
const mockFetchAuthQuery =
	vi.fn<(query: unknown, args: Record<string, never>) => Promise<unknown>>();

vi.mock("next/navigation", () => ({
	redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@convex-dev/better-auth/nextjs", () => ({
	convexBetterAuthNextJs: vi.fn(() => ({
		handler: {},
		preloadAuthQuery: vi.fn(),
		isAuthenticated: mockIsAuthenticated,
		getToken: vi.fn(),
		fetchAuthQuery: mockFetchAuthQuery,
		fetchAuthMutation: vi.fn(),
		fetchAuthAction: vi.fn(),
	})),
}));

vi.mock("@/core/env.client", () => ({
	clientEnv: {
		NEXT_PUBLIC_APP_URL: "http://localhost:3000",
		NEXT_PUBLIC_CONVEX_URL: "https://convex.test",
		NEXT_PUBLIC_CONVEX_SITE_URL: "https://convex-site.test",
	},
}));

describe("requireOnboardedProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRedirect.mockImplementation((url: string) => {
			throw new Error(`REDIRECT:${url}`);
		});
	});

	it("redirects to sign-in when there is no session", async () => {
		mockIsAuthenticated.mockResolvedValue(false);

		const { requireOnboardedProfile } = await import("@/auth/auth-server");

		await expect(requireOnboardedProfile()).rejects.toThrow("REDIRECT:/sign-in");
		expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
		expect(mockFetchAuthQuery).not.toHaveBeenCalled();
	});

	it("redirects to onboarding when session exists but profile is missing", async () => {
		mockIsAuthenticated.mockResolvedValue(true);
		mockFetchAuthQuery.mockResolvedValue(null);

		const { requireOnboardedProfile } = await import("@/auth/auth-server");

		await expect(requireOnboardedProfile()).rejects.toThrow("REDIRECT:/onboarding");
		expect(mockRedirect).toHaveBeenCalledWith("/onboarding");
	});

	it("returns profile when session and profile exist", async () => {
		const profile = { _id: "profiles|abc", name: "Ada" } as Doc<"profiles">;
		mockIsAuthenticated.mockResolvedValue(true);
		mockFetchAuthQuery.mockResolvedValue(profile);

		const { requireOnboardedProfile } = await import("@/auth/auth-server");

		await expect(requireOnboardedProfile()).resolves.toBe(profile);
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
