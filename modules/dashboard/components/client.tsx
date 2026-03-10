"use client";

import type { api } from "@/convex/_generated/api";
import { type Preloaded } from "convex/react";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/modules/dashboard/hooks/use-dashboard-data";
import EnvelopeCard from "./envelope-card";
import Header from "./header";
import IncomeRegisterButton from "./income-register-button";
import MonthSummaryBar from "./month-summary-bar";
import { RescueModeBanner } from "./rescue-mode-banner";
import StreakBanner from "./streak-banner";
import QuickActionCards from "./quick-action-cards";
import RecentExpenses from "./recent-expenses";

type Props = {
  preloaded: Preloaded<typeof api.payday.getDashboardData>;
};

export default function Client({ preloaded }: Props) {
  const dashboard = useDashboardData(preloaded);

  if (!dashboard) return null;

  const {
    profile,
    symbol,
    month,
    envelopeEntries,
    isCoupleModeEnabled,
    daysRemaining,
    budgetUsedPercent,
    rescueStatus,
    streak,
    lastAchievement,
    coachText,
    recentExpenses,
    filteredExpenses,
    filter,
    setFilter,
  } = dashboard;

  return (
    <>
      <Header name={profile.name} month={month} />

      <IncomeRegisterButton workerType={profile.workerType} />

      <MonthSummaryBar
        daysRemaining={daysRemaining}
        budgetUsedPercent={budgetUsedPercent}
        workerType={profile.workerType}
        payFrequency={profile.payFrequency}
        paydays={profile.paydays}
      />

      {rescueStatus.isInRescueMode ? (
        <RescueModeBanner
          needsOverflow={rescueStatus.needsOverflow}
          wantsOverflow={rescueStatus.wantsOverflow}
          currencySymbol={symbol}
        />
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-4 mb-6",
          isCoupleModeEnabled
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

      <StreakBanner
        currentStreak={streak?.currentStreak ?? 0}
        lastAchievement={lastAchievement}
      />

      <QuickActionCards coachText={coachText} />

      <RecentExpenses
        recentExpenses={recentExpenses}
        filteredExpenses={filteredExpenses}
        filter={filter}
        onFilterChange={setFilter}
        currencySymbol={symbol}
      />
    </>
  );
}
