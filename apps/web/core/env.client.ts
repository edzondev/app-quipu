import { z } from "zod";

const clientSchema = z.object({
	NEXT_PUBLIC_APP_URL: z.url(
		"NEXT_PUBLIC_APP_URL debe ser una URL válida (p. ej. http://localhost:3000)",
	),
	NEXT_PUBLIC_CONVEX_URL: z.url("NEXT_PUBLIC_CONVEX_URL debe ser una URL válida"),
	NEXT_PUBLIC_CONVEX_SITE_URL: z.url("NEXT_PUBLIC_CONVEX_SITE_URL debe ser una URL válida"),
	NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().optional(),
	NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
	NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export const clientEnv = clientSchema.parse({
	NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
	NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
	NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
	NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
	NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});

export type ClientEnv = z.infer<typeof clientSchema>;
