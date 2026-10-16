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

describe("robots + sitemap", () => {
	it("disallows exactly the private prefixes, including /espacios and /cycle/", () => {
		const rules = robots().rules;
		const disallow = Array.isArray(rules) ? undefined : rules.disallow;

		expect(disallow).toEqual([...privateRoutePrefixes]);
		expect(disallow).toEqual(expect.arrayContaining(["/espacios", "/cycle/"]));
	});

	it("keeps public routes allowed and listed in the sitemap", () => {
		const rules = robots().rules;
		const allow = Array.isArray(rules) ? undefined : rules.allow;
		const sitemapUrls = sitemap().map((entry) => entry.url);
		const sitemapPaths = sitemapUrls.map((url) => new URL(url).pathname);

		expect(allow).toEqual(expect.arrayContaining([...publicRoutes]));
		expect(sitemapPaths).toEqual([...publicRoutes]);
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
