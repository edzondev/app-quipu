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
import { pageMetadata, privateRoutePrefixes, publicRoutes } from "@/core/seo";

/** Contract for the prefix list: segment match, not raw `startsWith`. */
function matchesPrivatePrefix(pathname: string): boolean {
	return privateRoutePrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

describe("privateRoutePrefixes", () => {
	it("includes authenticated app areas that must stay out of sitemap and robots allow", () => {
		expect(privateRoutePrefixes).toEqual(expect.arrayContaining(["/espacios", "/cycle"]));
	});

	it("matches the prefix itself and nested paths", () => {
		expect(matchesPrivatePrefix("/cycle")).toBe(true);
		expect(matchesPrivatePrefix("/cycle/correct")).toBe(true);
		expect(matchesPrivatePrefix("/espacios")).toBe(true);
		expect(matchesPrivatePrefix("/espacios/abc")).toBe(true);
		expect(matchesPrivatePrefix("/savings")).toBe(true);
		expect(matchesPrivatePrefix("/savings/move")).toBe(true);
	});

	it("does not treat longer sibling paths as private (not raw startsWith)", () => {
		expect("/cycles-info".startsWith("/cycle")).toBe(true);
		expect("/espaciosX".startsWith("/espacios")).toBe(true);
		expect(matchesPrivatePrefix("/cycles-info")).toBe(false);
		expect(matchesPrivatePrefix("/espaciosX")).toBe(false);
		expect(matchesPrivatePrefix("/savings-extra")).toBe(false);
		expect(matchesPrivatePrefix("/income-tax")).toBe(false);
		expect(matchesPrivatePrefix("/progress2")).toBe(false);
	});

	it("does not mark public marketing/auth routes as private", () => {
		for (const path of publicRoutes) {
			expect(matchesPrivatePrefix(path)).toBe(false);
		}
	});
});

describe("robots + sitemap", () => {
	it("disallows exactly the private prefixes, including /espacios and /cycle", () => {
		const rules = robots().rules;
		const disallow = Array.isArray(rules) ? undefined : rules.disallow;

		expect(disallow).toEqual([...privateRoutePrefixes]);
		expect(disallow).toEqual(expect.arrayContaining(["/espacios", "/cycle"]));
	});

	it("keeps public routes allowed and listed in the sitemap", () => {
		const rules = robots().rules;
		const allow = Array.isArray(rules) ? undefined : rules.allow;
		const sitemapUrls = sitemap().map((entry) => entry.url);
		const sitemapPaths = sitemapUrls.map((url) => new URL(url).pathname);

		expect(allow).toEqual(expect.arrayContaining([...publicRoutes]));
		expect(sitemapPaths).toEqual([...publicRoutes]);
		expect(sitemapPaths.some((path) => matchesPrivatePrefix(path))).toBe(false);
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
