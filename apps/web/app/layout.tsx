import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ConvexClientProvider } from "@/core/components/providers/ConvexClientProvider"
import { getToken } from "@/lib/auth-server"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Quipu",
  description: "Personal finance for the Peruvian market",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialToken = await getToken()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider initialToken={initialToken}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
