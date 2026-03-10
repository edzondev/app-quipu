import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/core/components/providers/convex-client-provider";
import { getToken } from "@/lib/auth-server";
import { TooltipProvider } from "@/core/components/ui/tooltip";
import Script from "next/script";
import ToastProvider from "@/core/components/providers/toast-provider";
import { Suspense } from "react";

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

export const metadata: Metadata = {
  title: "Quipu",
  description: "Decide a dónde va tu sueldo antes de recibirlo.",
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
        <Suspense>
          <ConvexProviderWithToken>{children}</ConvexProviderWithToken>
        </Suspense>
      </body>
    </html>
  );
}
