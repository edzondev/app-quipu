"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
  GOALS_EMPTY_BODY,
  GOALS_EMPTY_BODY_MOBILE,
  GOALS_EMPTY_TITLE,
  GOALS_NEW_CTA,
  GOALS_NEW_MOBILE_CTA,
  GOALS_SECTION_LABEL,
  SAVINGS_CYCLE_CONTRIBUTION_PREFIX,
  SAVINGS_CYCLE_CONTRIBUTION_SUFFIX,
  SAVINGS_ERROR_BODY,
  SAVINGS_ERROR_RETRY,
  SAVINGS_ERROR_TITLE,
  SAVINGS_MOBILE_SUBTITLE,
  SAVINGS_PAGE_SUBTITLE,
  SAVINGS_PAGE_TITLE,
  SAVINGS_PRE_TRACTION_MOBILE_SUBTITLE,
  SAVINGS_PRE_TRACTION_SUBTITLE,
  SAVINGS_TOTAL_SAVED_LABEL,
} from "../constants";
import { buildCycleContributionSubtitle } from "../lib/savingsCopy";
import { useCycleSavingsBreakdown } from "../queries";
import { AssignSavingsCard } from "./assign-savings-card";
import { AssignSavingsSheet } from "./assign-savings-sheet";
import { ContributeGoalDialog } from "./contribute-goal-dialog";
import {
  CycleSavingsSection,
  CycleSavingsSectionSkeleton,
} from "./cycle-savings-section";
import { EmergencyFundHero } from "./emergency-fund-hero";
import { NewGoalDialog } from "./new-goal-dialog";
import { SavingsGoalCard } from "./savings-goal-card";

export function SavingsView() {
  const overview = useQuery(api.savings.getOverview, {});
  const cycleBreakdown = useCycleSavingsBreakdown();
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<{
    id: Id<"subEnvelopes">;
    label: string;
  } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  if (overview === undefined) {
    return <SavingsViewSkeleton />;
  }

  if (overview === null) {
    return (
      <section className="rounded-xl border border-danger-line bg-danger-bg p-5 md:p-6">
        <h2 className="text-base font-semibold text-danger-ink">
          {SAVINGS_ERROR_TITLE}
        </h2>
        <p className="mt-2 text-sm text-danger-text">{SAVINGS_ERROR_BODY}</p>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-4 border-danger-line text-danger-ink hover:bg-danger-banner",
          )}
          onClick={() => window.location.reload()}
        >
          {SAVINGS_ERROR_RETRY}
        </button>
      </section>
    );
  }

  const cycleSubtitleActive = buildCycleContributionSubtitle(
    overview.cycleContributionCents,
    overview.hasActiveCycle,
  );
  const isPreTraction =
    overview.emergencyFund !== null &&
    overview.emergencyFund.currentAmount === 0;

  const headerSubtitle = cycleSubtitleActive ? (
    <>
      {SAVINGS_CYCLE_CONTRIBUTION_PREFIX}{" "}
      {formatCents(overview.cycleContributionCents, {
        currency: overview.profile.currencyCode,
      })}{" "}
      {SAVINGS_CYCLE_CONTRIBUTION_SUFFIX}
    </>
  ) : isPreTraction ? (
    <>
      <span className="md:hidden">{SAVINGS_PRE_TRACTION_MOBILE_SUBTITLE}</span>
      <span className="hidden md:inline">{SAVINGS_PRE_TRACTION_SUBTITLE}</span>
    </>
  ) : (
    SAVINGS_MOBILE_SUBTITLE
  );

  const showGoalsEmptyState =
    overview.goals.length === 0 &&
    (isPreTraction || overview.emergencyFund?.currentAmount === 0);

  const availableToContributeCents =
    overview.emergencyFund?.availableToContributeCents ?? 0;
  const hasSurplusToMove = Boolean(
    cycleBreakdown &&
      (cycleBreakdown.wantsSurplusCents > 0 ||
        cycleBreakdown.needsSurplusCents > 0 ||
        (cycleBreakdown.extraordinarySurplusCents ?? 0) > 0),
  );
  // Canon: el Fondo es el único hero verde. El ciclo solo aparece si hay
  // historia que contar (monto > 0) o un empujón útil (bajo meta / sobrante).
  const showCycleSection = Boolean(
    overview.hasActiveCycle &&
      cycleBreakdown &&
      (cycleBreakdown.savingsTotalCents > 0 ||
        cycleBreakdown.showUnderTargetMessage ||
        hasSurplusToMove),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-mute md:hidden">
            {SAVINGS_PAGE_SUBTITLE}
          </p>
          <h1 className="font-serif text-[23px] font-medium text-ink md:text-[27px]">
            {SAVINGS_PAGE_TITLE}
          </h1>
          <p className="mt-1 text-[12.5px] text-mute-subtle md:text-[13.5px]">
            {headerSubtitle}
          </p>
        </div>
        <span className="hidden rounded-xl border border-line/70 bg-card px-3 py-2 text-[12.5px] font-medium text-ink-secondary md:inline">
          {SAVINGS_TOTAL_SAVED_LABEL} ·{" "}
          {formatCents(overview.totalSavedCents, {
            currency: overview.profile.currencyCode,
          })}
        </span>
      </header>

      {overview.emergencyFund ? (
        <EmergencyFundHero
          fund={overview.emergencyFund}
          currencyCode={overview.profile.currencyCode}
          hasActiveCycle={overview.hasActiveCycle}
        />
      ) : null}

      {overview.assignPlan ? (
        <AssignSavingsCard
          availableCents={overview.assignPlan.totalCents}
          currencyCode={overview.profile.currencyCode}
          onOpen={() => setAssignOpen(true)}
        />
      ) : null}

      <section>
        <div className="mb-3.5 flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-ink-secondary">
            {GOALS_SECTION_LABEL}
          </span>
          <div className="h-px flex-1 bg-line-divider" />
          {overview.canCreateGoal && !showGoalsEmptyState ? (
            <button
              type="button"
              className="text-[12.5px] font-medium text-qp-deep md:hidden"
              onClick={() => setNewGoalOpen(true)}
            >
              {GOALS_NEW_MOBILE_CTA}
            </button>
          ) : null}
          {overview.canCreateGoal && !showGoalsEmptyState ? (
            <button
              type="button"
              className="hidden text-[12.5px] font-medium text-qp-deep md:inline"
              onClick={() => setNewGoalOpen(true)}
            >
              {GOALS_NEW_CTA}
            </button>
          ) : null}
        </div>

        {overview.goals.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {overview.goals.map((goal) => (
              <SavingsGoalCard
                key={goal.id}
                goal={goal}
                currencyCode={overview.profile.currencyCode}
                hasActiveCycle={overview.hasActiveCycle}
                availableToContributeCents={availableToContributeCents}
                hasSurplusToMove={hasSurplusToMove}
                onContribute={() =>
                  setContributeGoal({ id: goal.id, label: goal.label })
                }
              />
            ))}
          </div>
        ) : showGoalsEmptyState ? (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-line/70 bg-surface-soft px-4 py-6 text-center md:gap-[7px] md:py-[26px]">
            <span
              className="flex size-10 items-center justify-center rounded-full border border-dashed border-mute md:size-10"
              aria-hidden
            >
              <span className="size-3.5 rounded-full border-[1.7px] border-mute-subtle" />
            </span>
            <p className="text-sm font-semibold text-ink-secondary md:text-sm">
              {GOALS_EMPTY_TITLE}
            </p>
            <p className="max-w-xs text-[12.5px] leading-normal text-faint md:text-[12.5px]">
              <span className="md:hidden">{GOALS_EMPTY_BODY_MOBILE}</span>
              <span className="hidden md:inline">{GOALS_EMPTY_BODY}</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-line/70 bg-surface-soft px-4 py-6 text-center md:gap-[7px] md:py-[26px]">
            <span
              className="flex size-10 items-center justify-center rounded-full border border-dashed border-mute"
              aria-hidden
            >
              <span className="size-3.5 rounded-full border-[1.7px] border-mute-subtle" />
            </span>
            <p className="text-sm font-semibold text-ink-secondary">
              {GOALS_EMPTY_TITLE}
            </p>
            <p className="max-w-xs text-[12.5px] leading-normal text-faint">
              {GOALS_EMPTY_BODY}
            </p>
            {overview.canCreateGoal ? (
              <button
                type="button"
                className="mt-2 text-[12.5px] font-medium text-qp-deep"
                onClick={() => setNewGoalOpen(true)}
              >
                {GOALS_NEW_CTA}
              </button>
            ) : null}
          </div>
        )}
      </section>

      {/* 6N debajo de metas: no compite con el hero Fondo (canon overview). */}
      {overview.hasActiveCycle ? (
        cycleBreakdown === undefined ? (
          <CycleSavingsSectionSkeleton />
        ) : showCycleSection && cycleBreakdown ? (
          <CycleSavingsSection breakdown={cycleBreakdown} />
        ) : null
      ) : null}

      <NewGoalDialog open={newGoalOpen} onOpenChange={setNewGoalOpen} />
      <AssignSavingsSheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        availableCents={overview.assignPlan?.totalCents ?? 0}
        currencyCode={overview.profile.currencyCode}
        plan={overview.assignPlan}
      />
      {contributeGoal ? (
        <ContributeGoalDialog
          open
          onOpenChange={(open) => {
            if (!open) setContributeGoal(null);
          }}
          goalId={contributeGoal.id}
          goalLabel={contributeGoal.label}
          availableCents={availableToContributeCents}
          currencyCode={overview.profile.currencyCode}
        />
      ) : null}
    </div>
  );
}

/** Canon bloque 6 "Cargando": cabecera con acción, hero del fondo y
 *  rejilla de metas con pulso escalonado. */
function SavingsViewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando tus ahorros"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-[30px] w-[180px] rounded-lg" />
        <Skeleton className="hidden h-[34px] w-[170px] rounded-lg [animation-delay:150ms] md:block" />
      </div>
      <Skeleton className="mt-5 h-[168px] w-full rounded-[20px] [animation-delay:150ms]" />
      <Skeleton className="mt-3 h-[104px] w-full rounded-xl [animation-delay:200ms]" />
      <Skeleton
        variant="line"
        className="mt-5 h-[11px] w-[90px] rounded-[5px]"
      />
      <div className="mt-3.5 grid gap-3 md:grid-cols-3">
        <Skeleton className="h-[78px] rounded-xl" />
        <Skeleton className="h-[78px] rounded-xl [animation-delay:150ms]" />
        <Skeleton className="h-[78px] rounded-xl [animation-delay:300ms]" />
        <Skeleton className="h-[78px] rounded-xl [animation-delay:150ms]" />
        <Skeleton className="h-[78px] rounded-xl [animation-delay:300ms]" />
        <Skeleton className="h-[78px] rounded-xl" />
      </div>
    </div>
  );
}
