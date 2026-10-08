import type { MetadataRoute } from "next";
import { getSiteUrl, publicRoutes } from "@/core/seo";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return publicRoutes.map((path) => ({
		url: new URL(path, getSiteUrl()).toString(),
		lastModified,
		changeFrequency: "monthly" as const,
		priority: path === "/" ? 1 : path === "/sign-in" ? 0.9 : 0.8,
	}));
}
