"use client";

import { Button } from "@/core/components/ui/button";
import { usePlan } from "@/hooks/use-plan";
import Link from "next/link";

export function UpgradeBanner() {
  const { isPremium, isLoading } = usePlan();

  if (isLoading || isPremium) return null;

  return (
    <div className="mx-2 mb-2 rounded-xl border bg-card p-4 flex flex-col items-center gap-3 text-center shadow-sm group-data-[collapsible=icon]:hidden">
      <div className="space-y-1">
        <p className="font-semibold text-sm leading-tight">Hazte Premium</p>
        <p className="text-xs text-muted-foreground leading-snug">
          Desbloquea todas las funciones de Quipu.
        </p>
      </div>

      <span className="text-4xl select-none" aria-hidden>
        🚀
      </span>

      <Button size="sm" className="w-full" asChild>
        <Link href="/upgrade">Ver planes</Link>
      </Button>
    </div>
  );
}
