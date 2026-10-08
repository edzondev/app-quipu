import type { MetadataRoute } from "next";
import { getSiteUrl, privateRoutePrefixes, publicRoutes } from "@/core/seo";

export default function robots(): MetadataRoute.Robots {
	const origin = getSiteUrl().origin;

	return {
		rules: {
			userAgent: "*",
			allow: [...publicRoutes, "/.well-known/"],
			disallow: [...privateRoutePrefixes],
		},
		sitemap: `${origin}/sitemap.xml`,
		host: origin,
	};
}
