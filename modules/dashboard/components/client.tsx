"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  MessageCircle,
  Receipt,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { api } from "@/convex/_generated/api";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { cn } from "@/lib/utils";
import EnvelopeCard from "./envelope-card";
import Header from "./header";

type Props = {
  preloaded: Preloaded<typeof api.payday.getDashboardData>;
};

type ExpenseFilter = "all" | "needs" | "wants";

const BADGE_CLASS: Record<string, string> = {
  needs: "bg-envelope-needs/15 text-envelope-needs border-0",
  wants: "bg-envelope-wants/15 text-envelope-wants border-0",
  juntos: "bg-envelope-juntos/15 text-envelope-juntos border-0",
};

const ENVELOPE_LABEL: Record<string, string> = {
  needs: "Necesidades",
  wants: "Gustos",
  juntos: "Juntos",
};

function fmt(value: number, symbol: string): string {
  const abs = Math.abs(value);
  const str = Number.isInteger(abs) ? abs.toString() : abs.toFixed(2);
  return value < 0 ? `-${symbol} ${str}` : `${symbol} ${str}`;
}

export default function Client({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  const router = useRouter();
  const [filter, setFilter] = useState<ExpenseFilter>("all");

  if (!data) return null;

  console.log({ data });

  const {
    profile,
    envelopes,
    recentExpenses,
    daysRemaining,
    budgetUsedPercent,
    rescueStatus,
    streak,
    lastAchievement,
    coachMessage,
  } = data;

  const symbol = profile.currencySymbol;

  const filteredExpenses =
    filter === "all"
      ? recentExpenses
      : recentExpenses.filter((e) => e.envelope === filter);

  const envelopeEntries = [
    {
      key: "needs" as const,
      data: envelopes.needs,
      allocationPct: profile.allocationNeeds,
    },
    {
      key: "wants" as const,
      data: envelopes.wants,
      allocationPct: profile.allocationWants,
    },
    {
      key: "savings" as const,
      data: envelopes.savings,
      allocationPct: profile.allocationSavings,
    },
    ...(data.isCoupleModeEnabled && envelopes.juntos
      ? [{ key: "juntos" as const, data: envelopes.juntos, allocationPct: 0 }]
      : []),
  ];

  // Compute coach insight text
  const coachText =
    coachMessage?.message ??
    (() => {
      const wantsAvailable = envelopes.wants.available ?? 0;
      if (wantsAvailable > 0 && daysRemaining > 0) {
        return `Te quedan ${symbol} ${wantsAvailable.toFixed(0)} en Gustos para los próximos ${daysRemaining} días. ¡Vas bien, mantén el ritmo!`;
      }
      if (wantsAvailable < 0) {
        return `Tu sobre de Gustos está en negativo. Considera ajustar tus gastos.`;
      }
      return "Revisa tus sobres para mantener el control de tu presupuesto.";
    })();

  return (
    <>
      <Header name={profile.name} month={data.month} />

      {/* Month summary bar */}
      <div className="animate-in fade-in duration-300 rounded-xl bg-muted p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {daysRemaining} días restantes en el mes
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.workerType === "independent"
                ? `Ingresos variables · ${budgetUsedPercent}% del presupuesto usado`
                : `Pago ${profile.payFrequency === "biweekly" ? "quincenal" : "mensual"} · día ${(profile.paydays ?? [])[0]} · ${budgetUsedPercent}% del presupuesto usado`}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-32 shrink-0">
          <div className="w-full h-2 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-envelope-needs transition-all duration-700"
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rescue mode banner */}
      {rescueStatus.isInRescueMode ? (
        <button
          type="button"
          className="w-full animate-in fade-in duration-300 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3 mb-6 text-left hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
          onClick={() => router.push("/rescue")}
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-red-700 dark:text-red-400">
              Modo Rescate activado
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">
              {rescueStatus.needsOverflow > 0
                ? `Necesidades está ${symbol} ${rescueStatus.needsOverflow.toFixed(0)} sobre el límite`
                : `Gustos está ${symbol} ${rescueStatus.wantsOverflow.toFixed(0)} sobre el límite`}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-red-500 shrink-0" />
        </button>
      ) : null}

      {/* Envelope cards */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 mb-6",
          data.isCoupleModeEnabled
            ? "md:grid-cols-2 xl:grid-cols-4"
            : "sm:grid-cols-3",
        )}
      >
        {envelopeEntries.map((entry, i) => (
          <EnvelopeCard
            key={entry.key}
            envelopeKey={entry.key}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={entry.data as any}
            allocationPct={entry.allocationPct}
            currencySymbol={symbol}
            index={i}
          />
        ))}
      </div>

      {profile.workerType === "independent" && (
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/register-income">+ Registrar ingreso de hoy</Link>
          </Button>
        </div>
      )}

      {/* Streak banner */}
      <Link href="/achievements" prefetch={false}>
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 flex items-center gap-3 mb-6 hover:bg-amber-100 dark:hover:bg-amber-950"
          style={{ animationDelay: "400ms" }}
        >
          <span className="text-xl shrink-0">🔥</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              Racha: {streak?.currentStreak ?? 0} meses consecutivos
            </p>
            <p className="text-xs text-muted-foreground">
              {lastAchievement
                ? `Último logro: ${lastAchievement.icon} ${lastAchievement.title}`
                : "Completa tu primer mes para desbloquear logros"}
            </p>
          </div>
          <div className="flex items-center gap-0.5 text-muted-foreground shrink-0">
            <Trophy className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      {/* Quick action cards */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
        style={{ animationDelay: "500ms" }}
      >
        {/* Coach message card */}
        <Card>
          <CardContent className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-envelope-savings shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-envelope-savings mb-1">
                Coach financiero
              </p>
              <p className="text-sm leading-relaxed">{coachText}</p>
            </div>
          </CardContent>
        </Card>

        {/* Savings detail card */}
        <button
          type="button"
          className="text-left"
          onClick={() => router.push("/savings")}
        >
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-start justify-between gap-3 h-full">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Ver detalle de ahorro</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fondos de emergencia, objetivos e inversión
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Recent expenses */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
        style={{ animationDelay: "600ms" }}
      >
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-semibold">Gastos recientes</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "needs", "wants"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      filter === f
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {f === "all"
                      ? "Todos"
                      : f === "needs"
                        ? "Necesidades"
                        : "Gustos"}
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-auto py-1"
                  onClick={() => router.push("/expenses")}
                >
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {recentExpenses.length === 0
                    ? "Aún no has registrado gastos. ¡Empieza registrando tu primer gasto!"
                    : "No hay gastos en esta categoría."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {expense.description ?? "Gasto"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="secondary"
                        className={BADGE_CLASS[expense.envelope] ?? ""}
                      >
                        {ENVELOPE_LABEL[expense.envelope] ?? expense.envelope}
                      </Badge>
                      <span className="text-sm font-semibold">
                        -{fmt(expense.amount, symbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
