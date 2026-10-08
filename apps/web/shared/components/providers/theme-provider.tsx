"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
	// Render the same structure on the server and first client render:
	// next-themes' inline <script> already wraps itself in `suppressHydrationWarning`
	// (see next-themes/dist/index.mjs) and switches the `nonce` attribute between
	// server and client. Branching on `typeof window` here would emit a different
	// `scriptProps` object on each side, which is exactly the hydration mismatch
	// rule prohibits.
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
