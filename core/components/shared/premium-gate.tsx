"use client";

import { Crown } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/use-plan";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  featureName?: string;
  className?: string;
};

export function PremiumGate({ children, featureName, className }: Props) {
  const { isPremium, isLoading } = usePlan();

  if (isLoading) {
    return (
      <div className={cn("animate-pulse space-y-3", className)}>
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  return (
    <div className={cn("space-y-0", className)}>
      {/* Dimmed preview */}
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>

      {/* Upgrade callout — sits below the preview, no absolute positioning */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-5 text-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {featureName ? `${featureName} es Premium` : "Función Premium"}
          </p>
          <p className="text-xs text-muted-foreground max-w-48">
            Actualiza tu plan para desbloquear esta función.
          </p>
        </div>
        <Button size="sm" asChild className="gap-1.5">
          <Link href="/upgrade">
            <Crown className="w-3.5 h-3.5" />
            Ver planes
          </Link>
        </Button>
      </div>
    </div>
  );
}
