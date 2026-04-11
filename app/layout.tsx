import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { Suspense } from "react";
import { ConvexClientProvider } from "@/core/components/providers/convex-client-provider";
import { PostHogPageView } from "@/core/components/providers/posthog-pageview";
import { PostHogProvider } from "@/core/components/providers/posthog-provider";
import ToastProvider from "@/core/components/providers/toast-provider";
import { TooltipProvider } from "@/core/components/ui/tooltip";
import { getToken } from "@/lib/auth-server";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const SITE_URL = process.env.SITE_URL ?? "https://quipu-finance.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Quipu — Distribuye tu sueldo automáticamente",
    template: "%s | Quipu",
  },
  description:
    "Quipu reparte tu sueldo con la regla 50/30/20 antes de que lo gastes. Sin conectar tu banco: tú decides, Quipu ordena. Hecho para Perú.",
  applicationName: "Quipu",
  keywords: [
    "presupuesto personal",
    "regla 50 30 20",
    "finanzas personales Perú",
    "app de ahorro",
    "control de gastos",
    "sobres presupuesto",
    "sueldo",
  ],
  authors: [{ name: "Quipu" }],
  creator: "Quipu",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    siteName: "Quipu",
    title: "Quipu — Distribuye tu sueldo automáticamente",
    description:
      "Reparte tu sueldo en Necesidades, Gustos y Ahorro. Sin banco, sin complicaciones.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "Quipu" },
      { url: "/quipu.webp", width: 1200, height: 630, alt: "Quipu" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quipu — Distribuye tu sueldo automáticamente",
    description: "Regla 50/30/20 aplicada a tu sueldo, sin tocar tu banco.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: { icon: "/quipu-logo.webp" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Quipu",
  url: SITE_URL,
  description:
    "App de finanzas personales que distribuye tu sueldo con la regla 50/30/20.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: "es-PE",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "PEN",
  },
};

async function ConvexProviderWithToken({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();
  return (
    <ConvexClientProvider initialToken={token}>
      <TooltipProvider>
        {children}
        <ToastProvider />
      </TooltipProvider>
    </ConvexClientProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body
        className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <Script
          id="ld-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw script injection for structured data.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <PostHogProvider>
          <Suspense>
            <PostHogPageView />
            <ConvexProviderWithToken>{children}</ConvexProviderWithToken>
          </Suspense>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
