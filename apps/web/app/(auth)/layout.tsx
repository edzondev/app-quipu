import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/core/seo";

export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s · ${siteConfig.name}`,
	},
};

/**
 * Shell canon del bloque auth: canvas neutro, sin chrome de template.
 * El split-panel es específico de sign-in (lo pone SignInView);
 * sign-up y estados van centrados con su propio gradiente radial.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return <div className="min-h-svh bg-canvas text-ink">{children}</div>;
}
