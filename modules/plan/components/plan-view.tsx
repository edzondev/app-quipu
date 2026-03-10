"use client";

import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { usePlanPortal } from "../hooks/use-plan-portal";
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Crown,
  ExternalLink,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

const FREE_FEATURES = [
  "Dashboard de sobres (50/30/20)",
  "Registro de gastos",
  "Historial del mes actual",
  "Ahorro básico",
];

const PREMIUM_FEATURES = [
  "Todo lo del plan gratuito",
  "Compromisos fijos mensuales",
  "Ingresos especiales",
  "Metas de ahorro avanzadas",
  "Modo pareja (Juntos)",
  "Historial completo",
  "Logros y rachas",
  "Coach financiero con IA",
];

export default function PlanView() {
  const {
    isLoading,
    isPremium,
    activatedAt,
    hasPolarCustomer,
    isLoadingPortal,
    portalError,
    handleOpenPortal,
  } = usePlanPortal();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mi Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu suscripción y accede al portal de facturación.
        </p>
      </div>

      {/* Plan Status Card */}
      {isPremium ? (
        <Card className="relative overflow-hidden border-primary/30 bg-linear-to-br from-primary/5 via-card to-card">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Plan Premium</CardTitle>
                  <CardDescription>Acceso completo a Quipu</CardDescription>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                Activo
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {activatedAt ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarCheck className="h-4 w-4 shrink-0" />
                <span>Miembro premium desde el {activatedAt}</span>
              </div>
            ) : null}

            {/* Portal Button */}
            {hasPolarCustomer ? (
              <div className="space-y-2">
                <Button
                  onClick={handleOpenPortal}
                  disabled={isLoadingPortal}
                  className="w-full gap-2"
                >
                  {isLoadingPortal ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Abriendo portal...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Gestionar suscripción
                      <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Actualiza tu método de pago, descarga facturas o cancela desde
                  el portal de Polar.
                </p>
                {portalError ? (
                  <p className="text-xs text-center text-destructive">
                    {portalError}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                El portal estará disponible una vez que tu suscripción sea
                procesada.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Plan Gratuito</CardTitle>
                  <CardDescription>Funciones esenciales</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Actual</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Estás usando la versión gratuita de Quipu. Actualiza a Premium
              para desbloquear todas las funciones.
            </p>
            <Button asChild className="w-full gap-2">
              <Link href="/upgrade">
                <Crown className="h-4 w-4" />
                Ver planes y precios
                <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Qué incluye tu plan?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(isPremium ? PREMIUM_FEATURES : FREE_FEATURES).map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}

          {!isPremium ? (
            <>
              <div className="my-2 border-t" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Solo en Premium
              </p>
              {PREMIUM_FEATURES.slice(1).map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 opacity-50"
                >
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
