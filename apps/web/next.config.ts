import { withSentryConfig } from "@sentry/nextjs";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// CSP: PostHog carga su recorder desde api_host; Convex usa https + wss.
// 'unsafe-inline' en script-src es el compromiso estándar sin middleware de
// nonces; 'unsafe-eval' solo en dev (React refresh).
// img-src incluye el host de PostHog para que session replay pueda capturar
// imágenes servidas desde el recorder (sin esto el replay sale en blanco).
const scriptSrc = [
	"'self'",
	"'unsafe-inline'",
	process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
	posthogHost,
	"https://challenges.cloudflare.com",
]
	.filter(Boolean)
	.join(" ");

const contentSecurityPolicy = [
	"default-src 'self'",
	`script-src ${scriptSrc}`,
	`connect-src 'self' ${posthogHost} https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://challenges.cloudflare.com`,
	`img-src 'self' data: blob: ${posthogHost}`,
	"style-src 'self' 'unsafe-inline'",
	"font-src 'self'",
	"frame-src https://challenges.cloudflare.com",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
	// Media-src para session replay si se capturan streams de audio/video
	// (no usados hoy, pero habilita el recorder por si se agregan).
	"media-src 'self' blob:",
].join("; ");

const securityHeaders = [
	{ key: "Content-Security-Policy", value: contentSecurityPolicy },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	// Passkeys (WebAuthn) permitidas solo en origen propio; resto de APIs off.
	{
		key: "Permissions-Policy",
		value:
			"camera=(), microphone=(), geolocation=(), publickey-credentials-get=(self), publickey-credentials-create=(self)",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
];

const nextConfig: NextConfig = {
	reactCompiler: true,
	experimental: {
		optimizePackageImports: ["date-fns"],
	},
	async rewrites() {
		return [
			// Alias estático esperado por auditorías SEO → icono PNG 32×32 generado en app/icon.tsx
			{ source: "/favicon-32x32.png", destination: "/icon" },
		];
	},
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default withSentryConfig(withBotId(nextConfig), {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: "edzonperez",

	project: "quipu-app",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	// tunnelRoute: "/monitoring",

	webpack: {
		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,

		// Tree-shaking options for reducing bundle size
		treeshake: {
			// Automatically tree-shake Sentry logger statements to reduce bundle size
			removeDebugLogging: true,
		},
	},
});
