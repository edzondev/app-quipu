"use client";

import type { Preloaded } from "convex/react";
import type { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/modules/dashboard/hooks/use-dashboard-data";
import { DashboardMainSkeleton } from "./dashboard-main-skeleton";
import EnvelopeCard from "./envelope-card";
import Header from "./header";
import IncomeRegisterButton from "./income-register-button";
import MonthSummaryBar from "./month-summary-bar";
import { PauseModeBanner } from "./pause-mode-banner";
import QuickActionCards from "./quick-action-cards";
import RecentExpenses from "./recent-expenses";
import { RescueModeBanner } from "./rescue-mode-banner";
import StreakBanner from "./streak-banner";

type Props = {
  preloaded: Preloaded<typeof api.payday.getDashboardData>;
};

export default function Client({ preloaded }: Props) {
  const dashboard = useDashboardData(preloaded);

  if (!dashboard) {
    return <DashboardMainSkeleton />;
  }

  return <DashboardBody dashboard={dashboard} />;
}

function DashboardBody({
  dashboard,
}: {
  dashboard: NonNullable<ReturnType<typeof useDashboardData>>;
}) {
  const {
    profile,
    symbol,
    month,
    envelopeEntries,
    isCoupleModeEnabled,
    daysRemaining,
    budgetUsedPercent,
    rescueStatus,
    pauseMode,
    streak,
    lastAchievement,
    coachText,
    recentExpenses,
    filteredExpenses,
    filter,
    setFilter,
  } = dashboard;

  if (pauseMode) {
    return (
      <>
        <Header name={profile.name} month={month} />
        <IncomeRegisterButton workerType={profile.workerType} />
        <PauseModeBanner
          remaining={pauseMode.remaining}
          currencySymbol={symbol}
        />
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
            data={entry.data}
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
