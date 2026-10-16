import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/env.client", () => ({
	clientEnv: {
		NEXT_PUBLIC_APP_URL: "https://quipu.app",
		NEXT_PUBLIC_CONVEX_URL: "https://convex.test",
		NEXT_PUBLIC_CONVEX_SITE_URL: "https://convex-site.test",
	},
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { isPrivateRoute, pageMetadata, privateRoutePrefixes, publicRoutes } from "@/core/seo";

describe("privateRoutePrefixes", () => {
	it("includes authenticated app areas that must stay out of sitemap and robots allow", () => {
		expect(privateRoutePrefixes).toEqual(expect.arrayContaining(["/espacios", "/cycle"]));
	});
});

describe("isPrivateRoute", () => {
	it("matches the prefix itself and nested paths", () => {
		expect(isPrivateRoute("/cycle")).toBe(true);
		expect(isPrivateRoute("/cycle/correct")).toBe(true);
		expect(isPrivateRoute("/espacios")).toBe(true);
		expect(isPrivateRoute("/espacios/abc")).toBe(true);
		expect(isPrivateRoute("/savings")).toBe(true);
		expect(isPrivateRoute("/savings/move")).toBe(true);
	});

	it("does not treat longer sibling paths as private (not raw startsWith)", () => {
		expect(isPrivateRoute("/cycles-info")).toBe(false);
		expect(isPrivateRoute("/espaciosX")).toBe(false);
		expect(isPrivateRoute("/savings-extra")).toBe(false);
		expect(isPrivateRoute("/income-tax")).toBe(false);
		expect(isPrivateRoute("/progress2")).toBe(false);
	});

	it("does not mark public marketing/auth routes as private", () => {
		for (const path of publicRoutes) {
			expect(isPrivateRoute(path)).toBe(false);
		}
	});
});

describe("robots + sitemap", () => {
	it("disallows private prefixes including /espacios and /cycle", () => {
		const rules = robots().rules;
		const disallow = Array.isArray(rules) ? undefined : rules.disallow;

		expect(disallow).toEqual(expect.arrayContaining(["/espacios", "/cycle"]));
		expect(disallow).not.toEqual(expect.arrayContaining(["/cycles-info", "/espaciosX"]));
	});

	it("keeps public routes allowed and listed in the sitemap", () => {
		const rules = robots().rules;
		const allow = Array.isArray(rules) ? undefined : rules.allow;
		const sitemapUrls = sitemap().map((entry) => entry.url);

		expect(allow).toEqual(expect.arrayContaining([...publicRoutes]));
		expect(sitemapUrls).toEqual(
			publicRoutes.map((path) => new URL(path, "https://quipu.app").toString()),
		);
		expect(sitemapUrls.some((url) => url.includes("/cycle") || url.includes("/espacios"))).toBe(
			false,
		);
	});
});

describe("pageMetadata for /cycle/correct", () => {
	it("sets noindex and the canonical path", () => {
		const metadata = pageMetadata({
			title: "Corregir ciclo",
			path: "/cycle/correct",
		});

		expect(metadata.title).toBe("Corregir ciclo");
		expect(metadata.alternates?.canonical).toBe("https://quipu.app/cycle/correct");
		expect(metadata.openGraph?.url).toBe("https://quipu.app/cycle/correct");
		expect(metadata.robots).toMatchObject({
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		});
	});
});
