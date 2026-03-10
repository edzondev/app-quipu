"use client";

import type { api } from "@/convex/_generated/api";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useState } from "react";

export type ExpenseFilter = "all" | "needs" | "wants";

export function useDashboardData(
  preloaded: Preloaded<typeof api.payday.getDashboardData>,
) {
  const data = usePreloadedQuery(preloaded);
  const [filter, setFilter] = useState<ExpenseFilter>("all");

  if (!data) return null;

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
    isCoupleModeEnabled,
    month,
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
    ...(isCoupleModeEnabled && envelopes.juntos
      ? [{ key: "juntos" as const, data: envelopes.juntos, allocationPct: 0 }]
      : []),
  ];

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

  return {
    // Profile
    profile,
    symbol,
    month,
    // Envelopes
    envelopes,
    envelopeEntries,
    isCoupleModeEnabled,
    // Budget summary
    daysRemaining,
    budgetUsedPercent,
    // Rescue
    rescueStatus,
    // Gamification
    streak,
    lastAchievement,
    // Coach
    coachText,
    // Expenses
    recentExpenses,
    filteredExpenses,
    filter,
    setFilter,
  };
}
