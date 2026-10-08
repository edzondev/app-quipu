import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getToken } from "@/auth/auth-server";
import { rootMetadata, siteConfig } from "@/core/seo";
import { AppearanceSync } from "@/modules/progress/components/appearance-sync";
import { ConvexClientProvider } from "@/shared/components/providers/convex-provider";
import { ThemeProvider } from "@/shared/components/providers/theme-provider";
import { SiteJsonLd } from "@/shared/components/seo/site-json-ld";
import { AppToaster } from "@/shared/components/ui/toaster";
import { cn } from "@/shared/lib/utils";

// Product UI: Geist only. font-serif / font-mono utilities alias to the same family.
const geist = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#faf8f5" },
		{ media: "(prefers-color-scheme: dark)", color: "#2a2926" },
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const initialToken = await getToken();
	return (
		<html
			lang={siteConfig.language}
			suppressHydrationWarning
			className={cn("h-full", "antialiased", geist.variable, "font-sans")}
		>
			<body className="flex min-h-full flex-col">
				<SiteJsonLd />
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<ConvexClientProvider initialToken={initialToken}>
						<AppearanceSync />
						{children}
						<AppToaster />
					</ConvexClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
