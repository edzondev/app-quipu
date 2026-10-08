import type { MetadataRoute } from "next";
import { siteConfig } from "@/core/seo";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${siteConfig.name} — ${siteConfig.tagline}`,
		short_name: siteConfig.name,
		description: siteConfig.description,
		start_url: "/sign-in",
		display: "standalone",
		background_color: "#faf8f5",
		theme_color: "#41648a",
		lang: siteConfig.language,
		icons: [
			{
				src: "/icon",
				sizes: "32x32",
				type: "image/png",
			},
			{
				src: "/apple-icon",
				sizes: "180x180",
				type: "image/png",
			},
		],
	};
}
