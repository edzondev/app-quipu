import type { Metadata } from "next";
import { clientEnv } from "@/core/env.client";

/** Copy alineado a QUIPU-MASTER §2.1 */
export const siteConfig = {
	name: "Quipu",
	tagline: "Tu sueldo, con disciplina.",
	landingLine: "Sabe si puedes gastar, en segundos.",
	/** ~154 chars — dentro del rango 110–160 para SERP y OG. */
	description:
		"Quipu divide tu sueldo en tres sobres (Necesidades, Gustos y Ahorro) para saber cuánto puedes gastar hoy. Finanzas personales en soles, hecho para Perú.",
	locale: "es_PE",
	language: "es",
	/** Cuenta X/Twitter oficial; usada en twitter:site. */
	twitterSite: "@heyedzon",
} as const;

export const defaultPageTitle = `${siteConfig.name} — ${siteConfig.tagline}`;

export function getSiteUrl(): URL {
	return new URL(clientEnv.NEXT_PUBLIC_APP_URL);
}

export function absoluteUrl(path: string): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return new URL(normalized, getSiteUrl()).toString();
}

const privateRobots: Metadata["robots"] = {
	index: false,
	follow: false,
	googleBot: { index: false, follow: false },
};

const publicRobots: Metadata["robots"] = {
	index: true,
	follow: true,
	googleBot: { index: true, follow: true },
};

type PageMetadataInput = {
	title: string;
	description?: string;
	path: string;
	/** Por defecto true; rutas autenticadas deben pasar `false`. */
	index?: boolean;
};

/** Metadatos por ruta; el layout raíz aplica `title.template`. */
export function pageMetadata({
	title,
	description = siteConfig.description,
	path,
	index = false,
}: PageMetadataInput): Metadata {
	const canonical = absoluteUrl(path);
	const robots = index ? publicRobots : privateRobots;

	return {
		title,
		description,
		alternates: { canonical },
		robots,
		openGraph: {
			title,
			description,
			url: canonical,
			locale: "es_PE",
			siteName: siteConfig.name,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			site: siteConfig.twitterSite,
			title,
			description,
		},
	};
}

export const rootMetadata: Metadata = {
	metadataBase: getSiteUrl(),
	title: {
		default: defaultPageTitle,
		template: `%s · ${siteConfig.name}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	category: "finance",
	alternates: {
		canonical: absoluteUrl("/"),
	},
	robots: publicRobots,
	openGraph: {
		type: "website",
		locale: "es_PE",
		siteName: siteConfig.name,
		title: defaultPageTitle,
		description: siteConfig.description,
		url: absoluteUrl("/"),
	},
	twitter: {
		card: "summary_large_image",
		site: siteConfig.twitterSite,
		title: defaultPageTitle,
		description: siteConfig.description,
	},
	icons: {
		icon: [
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [{ url: "/apple-icon", type: "image/png" }],
	},
};

export const privateAreaMetadata: Metadata = {
	robots: privateRobots,
};

/** Rutas públicas indexables (sitemap + robots allow). */
export const publicRoutes = ["/", "/sign-in", "/sign-up", "/terminos", "/privacidad"] as const;

/** Prefijos que no deben indexarse ni aparecer en sitemap. */
export const privateRoutePrefixes = [
	"/api",
	"/dashboard",
	"/onboarding",
	"/movements",
	"/commitments",
	"/savings",
	"/progress",
	"/settings",
	"/income",
	"/auth",
] as const;
