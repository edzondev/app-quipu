import Link from "next/link";
import { Button } from "@/core/components/ui/button";
import Image from "next/image";

export function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1">
          <Image
            src="/quipu-logo.webp"
            alt="quipu logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-semibold tracking-tight">quipu</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" prefetch={false}>
              Iniciar sesión
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register" prefetch={false}>
              Empezar gratis
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
