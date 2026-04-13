"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { PremiumBadge } from "@/core/components/shared/premium-badge";
import { UpgradeCheckoutButton } from "@/core/components/shared/upgrade-checkout-button";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { usePlan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "Asignación automática 50/30/20",
  "Registro de gastos (hasta 20/mes)",
  "3 sobres: Necesidades, Gustos y Ahorro",
  "1 objetivo de ahorro",
  "3 badges iniciales",
  "1 consejo del coach por semana",
];

const PREMIUM_FEATURES = [
  "Todo lo gratuito, sin límites",
  "Gastos ilimitados por mes",
  "Modo Rescate para sobres en negativo",
  "Cuotas y deudas fijas en día de pago",
  "Objetivos ilimitados con emoji y fecha",
  "Todos los badges + rachas premium",
  "Modo Pareja con sobre compartido",
  "Coach diario personalizado con IA",
];

export default function PlansView() {
  const { isPremium, isFree, isLoading } = usePlan();
  const router = useRouter();

  return (
    <div className="min-h-dvh px-4 py-10 md:px-8">
      {/* Back arrow */}
      <Button variant="ghost" type="button" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      {isLoading ? (
        <output className="block w-full" aria-live="polite" aria-busy="true">
          <span className="sr-only">Cargando planes</span>
          <div className="mb-10 space-y-4 text-center">
            <Skeleton className="mx-auto h-10 w-[min(100%,20rem)] rounded-lg md:h-12" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
          <div className="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-border/70">
              <CardContent className="flex flex-col gap-5 p-7 pt-8">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="mt-4 h-10 w-32 rounded-md" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
                <div className="space-y-2.5 pt-2">
                  {["x", "y", "z", "w"].map((k, i) => (
                    <div key={k} className="flex gap-2.5">
                      <Skeleton
                        className="mt-0.5 h-4 w-4 shrink-0 rounded-sm"
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                      <Skeleton className="h-4 flex-1 rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/25">
              <CardContent className="flex flex-col gap-5 p-7 pt-8">
                <Skeleton className="h-6 w-28 rounded-full self-start" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="mt-4 h-10 w-36 rounded-md" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
                <div className="space-y-2.5 pt-2">
                  {["a", "b", "c", "d"].map((k, i) => (
                    <div key={k} className="flex gap-2.5">
                      <Skeleton
                        className="mt-0.5 h-4 w-4 shrink-0 rounded-sm"
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                      <Skeleton className="h-4 flex-1 rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Skeleton className="mx-auto h-3 w-64 max-w-full rounded-md" />
        </output>
      ) : (
        <>
          {/* Title */}
          <div className="text-center mb-10 space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Planes que crecen contigo
            </h1>

            {/* Current plan pill */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Tu plan actual:</span>
              {isPremium ? (
                <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <PremiumBadge size="sm" className="text-amber-500" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary">Gratuito</Badge>
              )}
            </div>
          </div>

          {/* Plan cards */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Free card */}
            <Card className="relative flex flex-col">
              <CardContent className="flex flex-col gap-5 flex-1 p-7 pt-8">
                {/* Title & price */}
                <div>
                  <h2 className="text-xl font-bold">Gratis</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Para empezar a ordenar tus finanzas
                  </p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-sm text-muted-foreground">
                      USD / mes
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm",
                    isFree
                      ? "border-gray bg-gray-50 text-gray-500 font-medium"
                      : "border-dashed border-border bg-muted/40 text-muted-foreground",
                  )}
                >
                  {isFree ? "Estás en este plan" : "Plan base incluido"}
                </div>

                {/* Features */}
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Incluye
                  </p>
                  <ul className="space-y-2.5">
                    {FREE_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Premium card */}
            <Card
              className={cn(
                "relative flex flex-col border-2",
                isPremium
                  ? "border-amber-400 dark:border-amber-600"
                  : "border-primary",
              )}
            >
              <div className="absolute -top-3 left-5">
                {isPremium ? (
                  <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <PremiumBadge size="sm" className="text-amber-500" />
                    Plan actual
                  </Badge>
                ) : (
                  <Badge>Recomendado</Badge>
                )}
              </div>

              <CardContent className="flex flex-col gap-5 flex-1 p-7 pt-8">
                {/* Title & price */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">Premium</h2>
                    <PremiumBadge size="md" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Sin límites, con herramientas avanzadas
                  </p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold">$4.99</span>
                    <span className="text-sm text-muted-foreground">
                      USD / mes
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <UpgradeCheckoutButton size="default" className="w-full" />

                {/* Features */}
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Todo lo gratuito, más:
                  </p>
                  <ul className="space-y-2.5">
                    {PREMIUM_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground max-w-md mx-auto">
            El pago se procesa de forma segura a través de Polar. Cancela cuando
            quieras, sin permanencia.
          </p>
        </>
      )}
    </div>
  );
}
