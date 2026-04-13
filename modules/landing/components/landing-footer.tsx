"use client";

import Link from "next/link";

export function LandingFooter() {

  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="flex-1 font-semibold text-foreground">Quipu</span>
        <div className="flex flex-1 items-center gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Términos
          </Link>
          <span>·</span>
          <Link href="/privacy" className="flex-1 hover:text-foreground">
            Privacidad
          </Link>
        </div>
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} Quipu. Hecho en Perú 🇵🇪
        </span>
      </div>
    </footer>
  );
}
