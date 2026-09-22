"use client";

import Link from "next/link";
import { useState } from "react";
import { InfoCircle } from "reicon-react/icons/InfoCircle";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
  CYCLE_SAVINGS_ABOVE_BADGE_MOBILE_PREFIX,
  CYCLE_SAVINGS_ABOVE_BADGE_MOBILE_SUFFIX,
  CYCLE_SAVINGS_ABOVE_BADGE_PREFIX,
  CYCLE_SAVINGS_ABOVE_BADGE_SUFFIX,
  CYCLE_SAVINGS_ADDITIONAL_HINT,
  CYCLE_SAVINGS_ADDITIONAL_LABEL,
  CYCLE_SAVINGS_AVAILABLE_COPY_PREFIX,
  CYCLE_SAVINGS_AVAILABLE_COPY_SUFFIX,
  CYCLE_SAVINGS_BADGE_LABEL,
  CYCLE_SAVINGS_BELOW_ACK_CTA,
  CYCLE_SAVINGS_BELOW_BODY_MIDDLE,
  CYCLE_SAVINGS_BELOW_BODY_PREFIX,
  CYCLE_SAVINGS_BELOW_BODY_SUFFIX,
  CYCLE_SAVINGS_BELOW_MOVE_CTA,
  CYCLE_SAVINGS_BELOW_OBJECTIVE_LABEL,
  CYCLE_SAVINGS_BELOW_PROGRESS_LABEL,
  CYCLE_SAVINGS_BELOW_REASSURANCE_BODY,
  CYCLE_SAVINGS_BELOW_REASSURANCE_TITLE,
  CYCLE_SAVINGS_BELOW_SAVED_LABEL,
  CYCLE_SAVINGS_BELOW_TITLE,
  CYCLE_SAVINGS_LEGEND_ADDITIONAL,
  CYCLE_SAVINGS_LEGEND_ADDITIONAL_SHORT,
  CYCLE_SAVINGS_LEGEND_OBJECTIVE,
  CYCLE_SAVINGS_LEGEND_OBJECTIVE_SHORT,
  CYCLE_SAVINGS_META_WAS_PREFIX,
  CYCLE_SAVINGS_MOVE_CTA,
  CYCLE_SAVINGS_MOVE_MORE_TITLE,
  CYCLE_SAVINGS_MOVE_SURPLUS_COPY,
  CYCLE_SAVINGS_OBJECTIVE_LABEL,
  CYCLE_SAVINGS_PARKED_COPY,
  CYCLE_SAVINGS_ROUND_UP_TITLE_PREFIX,
  CYCLE_SAVINGS_SAVED_THIS_CYCLE_SUFFIX,
  CYCLE_SAVINGS_SECTION_ID,
  CYCLE_SAVINGS_SECTION_TITLE,
  CYCLE_SAVINGS_TOTAL_HINT,
  CYCLE_SAVINGS_TOTAL_LABEL,
  cycleSavingsObjectiveHint,
  cycleSavingsRoundUpBody,
} from "../constants";
import type { CycleSavingsBreakdown } from "../types";

type Props = {
  breakdown: CycleSavingsBreakdown;
};

export function CycleSavingsSection({ breakdown }: Props) {
  const { currencyCode } = breakdown;
  const format = (cents: number) =>
    formatCents(cents, { currency: currencyCode });

  const surplusAvailableCents = Math.max(
    breakdown.wantsSurplusCents,
    breakdown.needsSurplusCents,
    breakdown.extraordinarySurplusCents ?? 0,
  );
  const hasAnySurplus =
    breakdown.wantsSurplusCents > 0 ||
    breakdown.needsSurplusCents > 0 ||
    (breakdown.extraordinarySurplusCents ?? 0) > 0;
  const roundUp = computeRoundUpSuggestion(
    breakdown.savingsTotalCents,
    surplusAvailableCents,
  );

  if (breakdown.showUnderTargetMessage) {
    return (
      <section
        className="mt-6"
        id={CYCLE_SAVINGS_SECTION_ID}
        aria-labelledby="cycle-savings-heading"
      >
        <SectionHeader breakdown={breakdown} format={format} />
        <BelowObjectivePanel breakdown={breakdown} format={format} />
      </section>
    );
  }

  return (
    <section
      className="mt-6"
      id={CYCLE_SAVINGS_SECTION_ID}
      aria-labelledby="cycle-savings-heading"
    >
      <SectionHeader breakdown={breakdown} format={format} />

      {/* Canon overview: solo el Fondo lleva el shield verde. El ciclo es
          flujo (cuánto entró), no un segundo hero del mismo color. */}
      <article className="relative overflow-hidden rounded-xl border border-line/70 bg-card p-5 md:p-7">
        {breakdown.showAboveTargetCelebration &&
        breakdown.aboveTargetByCents > 0 ? (
          <div className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-qp-shield-line bg-qp-panel px-3 py-1.5 md:px-[13px] md:py-1.5">
            <span className="size-1.5 rounded-full bg-moss" aria-hidden />
            <span className="text-[11px] font-semibold text-qp-deep md:hidden">
              {CYCLE_SAVINGS_ABOVE_BADGE_MOBILE_PREFIX}{" "}
              {format(breakdown.aboveTargetByCents)}{" "}
              {CYCLE_SAVINGS_ABOVE_BADGE_MOBILE_SUFFIX}
            </span>
            <span className="hidden text-[12.5px] font-semibold text-qp-deep md:inline">
              {CYCLE_SAVINGS_ABOVE_BADGE_PREFIX}{" "}
              {format(breakdown.aboveTargetByCents)}{" "}
              {CYCLE_SAVINGS_ABOVE_BADGE_SUFFIX}
            </span>
          </div>
        ) : null}

        <div className="relative flex flex-col gap-1 md:flex-row md:flex-wrap md:items-end md:gap-4">
          <p className="font-serif text-[34px] leading-none text-ink md:text-[40px]">
            {format(breakdown.savingsTotalCents)}
          </p>
          {breakdown.savingsObjectiveCents > 0 ? (
            <p className="text-sm text-mute md:pb-1.5">
              <span className="md:hidden">
                {CYCLE_SAVINGS_META_WAS_PREFIX}{" "}
                {format(breakdown.savingsObjectiveCents)}
              </span>
              <span className="hidden md:inline">
                {CYCLE_SAVINGS_SAVED_THIS_CYCLE_SUFFIX}{" "}
                {format(breakdown.savingsObjectiveCents)}
              </span>
            </p>
          ) : null}
        </div>

        {breakdown.savingsTotalCents > 0 &&
        breakdown.savingsRemainingCents <= 0 &&
        breakdown.savingsSetAsideCents > 0 ? (
          <p className="relative mt-3 text-[12.5px] text-qp-deep md:text-[13.5px]">
            {CYCLE_SAVINGS_PARKED_COPY}
          </p>
        ) : breakdown.savingsRemainingCents > 0 ? (
          <p className="relative mt-3 text-[12.5px] text-mute md:text-[13.5px]">
            {CYCLE_SAVINGS_AVAILABLE_COPY_PREFIX}{" "}
            <span className="font-semibold text-ink">
              {format(breakdown.savingsRemainingCents)}
            </span>{" "}
            {CYCLE_SAVINGS_AVAILABLE_COPY_SUFFIX}
          </p>
        ) : null}

        {breakdown.savingsTotalCents > 0 ? (
          <>
            <div className="relative mt-5 flex h-3 overflow-hidden rounded-lg bg-qp-track md:h-3.5">
              <div
                className="h-full bg-moss"
                style={{ width: `${breakdown.objectiveBarPercent}%` }}
              />
              <div
                className="h-full bg-[repeating-linear-gradient(45deg,#7fb39f,#7fb39f_5px,#9cc6b6_5px,#9cc6b6_10px)]"
                style={{ width: `${breakdown.additionalBarPercent}%` }}
              />
            </div>
            <div className="relative mt-3 flex flex-wrap gap-4 md:gap-6">
              <LegendSwatch
                variant="objective"
                label={CYCLE_SAVINGS_LEGEND_OBJECTIVE_SHORT}
                labelDesktop={CYCLE_SAVINGS_LEGEND_OBJECTIVE}
              />
              <LegendSwatch
                variant="additional"
                label={CYCLE_SAVINGS_LEGEND_ADDITIONAL_SHORT}
                labelDesktop={CYCLE_SAVINGS_LEGEND_ADDITIONAL}
              />
            </div>
          </>
        ) : null}
      </article>

      <div className="mt-3 flex flex-col gap-2 md:hidden">
        <MobileMetricRow
          label={CYCLE_SAVINGS_OBJECTIVE_LABEL}
          amount={format(breakdown.savingsObjectiveCents)}
          variant="objective"
        />
        <MobileMetricRow
          label={CYCLE_SAVINGS_ADDITIONAL_LABEL}
          amount={format(breakdown.savingsAdditionalCents)}
          variant="additional"
          amountClassName="text-qp-deep"
        />
        <MobileMetricRow
          label={CYCLE_SAVINGS_TOTAL_LABEL}
          amount={format(breakdown.savingsTotalCents)}
          variant="total"
        />
      </div>
      <div className="mt-3 hidden gap-3 md:mt-4 md:grid md:grid-cols-3">
        <MetricCard
          label={CYCLE_SAVINGS_OBJECTIVE_LABEL}
          hint={cycleSavingsObjectiveHint(breakdown.allocationSavingsPercent)}
          amount={format(breakdown.savingsObjectiveCents)}
          variant="objective"
        />
        <MetricCard
          label={CYCLE_SAVINGS_ADDITIONAL_LABEL}
          hint={CYCLE_SAVINGS_ADDITIONAL_HINT}
          amount={format(breakdown.savingsAdditionalCents)}
          variant="additional"
          amountClassName="text-qp-deep"
        />
        <MetricCard
          label={CYCLE_SAVINGS_TOTAL_LABEL}
          hint={CYCLE_SAVINGS_TOTAL_HINT}
          amount={format(breakdown.savingsTotalCents)}
          variant="total"
        />
      </div>

      {hasAnySurplus ? (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-line/70 bg-card p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-qp-panel text-qp-deep">
              <span className="relative block size-4">
                <span className="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-full bg-current" />
                <span className="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-full bg-current" />
              </span>
            </span>
            <div>
              <p className="text-sm font-semibold text-ink md:text-[14.5px]">
                {roundUp
                  ? `${CYCLE_SAVINGS_ROUND_UP_TITLE_PREFIX} ${format(roundUp.targetCents)}?`
                  : CYCLE_SAVINGS_MOVE_MORE_TITLE}
              </p>
              <p className="mt-0.5 text-[12.5px] text-mute">
                {roundUp
                  ? cycleSavingsRoundUpBody(format(roundUp.moveCents))
                  : CYCLE_SAVINGS_MOVE_SURPLUS_COPY}
              </p>
            </div>
          </div>
          <Link
            href={buildMoveSurplusHref(breakdown, roundUp?.moveCents)}
            className={cn(buttonVariants(), "w-full shrink-0 md:w-auto")}
          >
            {CYCLE_SAVINGS_MOVE_CTA}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function CycleSavingsSectionSkeleton() {
  return (
    <section className="mt-6 space-y-3">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton variant="line" className="h-4 w-40" />
      <Skeleton className="h-48 w-full rounded-[20px] [animation-delay:150ms]" />
      <div className="flex flex-col gap-2 md:hidden">
        <Skeleton className="h-11.5 rounded-xl" />
        <Skeleton className="h-11.5 rounded-xl [animation-delay:150ms]" />
        <Skeleton className="h-11.5 rounded-xl [animation-delay:300ms]" />
      </div>
      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl [animation-delay:150ms]" />
        <Skeleton className="h-28 rounded-xl [animation-delay:300ms]" />
      </div>
    </section>
  );
}

const HUNDRED_SOLES_CENTS = 10_000;

function computeRoundUpSuggestion(
  totalCents: number,
  surplusCents: number,
): { targetCents: number; moveCents: number } | null {
  if (totalCents <= 0 || surplusCents <= 0) {
    return null;
  }
  const nextHundredCents =
    Math.ceil(totalCents / HUNDRED_SOLES_CENTS) * HUNDRED_SOLES_CENTS;
  if (nextHundredCents <= totalCents) {
    return null;
  }
  const moveCents = nextHundredCents - totalCents;
  if (moveCents > surplusCents) {
    return null;
  }
  return { targetCents: nextHundredCents, moveCents };
}

function buildMoveSurplusHref(
  breakdown: CycleSavingsBreakdown,
  amountCents?: number,
): string {
  const from =
    breakdown.wantsSurplusCents > 0
      ? "wants"
      : breakdown.needsSurplusCents > 0
        ? "needs"
        : (breakdown.extraordinarySurplusCents ?? 0) > 0
          ? "extraordinary"
          : "wants";
  const params = new URLSearchParams({ from });
  if (amountCents !== undefined && amountCents > 0) {
    params.set("amount", String(amountCents));
  }
  return `/savings/move?${params.toString()}`;
}

function SectionHeader({
  breakdown,
  format,
}: {
  breakdown: CycleSavingsBreakdown;
  format: (cents: number) => string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2
          id="cycle-savings-heading"
          className="font-serif text-[20px] font-medium text-ink md:text-[22px]"
        >
          {CYCLE_SAVINGS_SECTION_TITLE}
        </h2>
        <p className="mt-0.5 text-[12px] text-mute-subtle md:text-[13.5px]">
          {breakdown.cycleContextLabel}
        </p>
      </div>
      <span className="hidden rounded-xl border border-line/70 bg-card px-3 py-2 text-[12.5px] font-medium text-ink-secondary md:inline">
        {CYCLE_SAVINGS_BADGE_LABEL} · {format(breakdown.savingsTotalCents)}
      </span>
    </div>
  );
}

function BelowObjectivePanel({
  breakdown,
  format,
}: {
  breakdown: CycleSavingsBreakdown;
  format: (cents: number) => string;
}) {
  const progressPercent = breakdown.objectiveProgressPercent;
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const hasSurplus =
    breakdown.wantsSurplusCents > 0 ||
    breakdown.needsSurplusCents > 0 ||
    (breakdown.extraordinarySurplusCents ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-clay-soft"
            aria-hidden
          >
            <InfoCircle
              size={20}
              color="var(--color-clay)"
              weight="Outline"
              strokeWidth={2.4}
              strokeMiterlimit={5}
            />
          </span>
          <h3 className="font-serif text-[22px] font-medium text-ink md:text-[25px]">
            {CYCLE_SAVINGS_BELOW_TITLE}
          </h3>
        </div>
        <p className="mt-2 text-sm text-qp-text text-pretty md:mt-0 md:pl-12">
          {CYCLE_SAVINGS_BELOW_BODY_PREFIX}{" "}
          <strong className="font-semibold text-ink">
            {format(breakdown.savingsSetAsideCents)}
          </strong>{" "}
          {CYCLE_SAVINGS_BELOW_BODY_MIDDLE}{" "}
          <strong className="font-semibold text-ink">
            {format(breakdown.savingsObjectiveCents)}
          </strong>
          . {CYCLE_SAVINGS_BELOW_BODY_SUFFIX}
        </p>
      </div>

      <article className="rounded-xl border border-line/70 bg-card p-5 md:p-6">
        <div className="mb-3.5 flex items-end justify-between">
          <span className="text-[13px] text-mute">
            {CYCLE_SAVINGS_BELOW_PROGRESS_LABEL}
          </span>
          <span className="font-mono text-lg text-qp-text">
            {progressPercent}%
          </span>
        </div>
        <div className="relative h-3.5 overflow-hidden rounded-lg bg-qp-track">
          <div
            className="h-full rounded-lg bg-linear-to-r from-moss-soft to-moss"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] text-faint">
          <span>
            {format(breakdown.savingsSetAsideCents)}{" "}
            {CYCLE_SAVINGS_BELOW_SAVED_LABEL}
          </span>
          <span>
            {CYCLE_SAVINGS_BELOW_OBJECTIVE_LABEL}{" "}
            {format(breakdown.savingsObjectiveCents)}
          </span>
        </div>
      </article>

      <div className="flex items-start gap-3 rounded-xl border border-qp-shield-line bg-qp-success px-4 py-3.5">
        <InfoCircle size={24} weight="Filled" color="var(--color-qp)" />
        <p className="text-[13.5px] leading-relaxed text-qp-deep">
          <strong className="font-semibold">
            {CYCLE_SAVINGS_BELOW_REASSURANCE_TITLE}
          </strong>{" "}
          {CYCLE_SAVINGS_BELOW_REASSURANCE_BODY}
        </p>
      </div>

      {!ctaDismissed ? (
        hasSurplus ? (
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-auto flex-1 rounded-[11px] py-[13px] text-[14.5px]"
              onClick={() => setCtaDismissed(true)}
            >
              {CYCLE_SAVINGS_BELOW_ACK_CTA}
            </Button>
            <Link
              href={buildMoveSurplusHref(breakdown)}
              className={cn(
                buttonVariants(),
                "h-auto flex-1 rounded-[11px] py-[13px] text-center text-[14.5px]",
              )}
            >
              {CYCLE_SAVINGS_BELOW_MOVE_CTA}
            </Link>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full rounded-[11px] py-[13px] text-[14.5px] md:w-auto"
            onClick={() => setCtaDismissed(true)}
          >
            {CYCLE_SAVINGS_BELOW_ACK_CTA}
          </Button>
        )
      ) : null}
    </div>
  );
}

function MobileMetricRow({
  label,
  amount,
  variant,
  amountClassName,
}: {
  label: string;
  amount: string;
  variant: "objective" | "additional" | "total";
  amountClassName?: string;
}) {
  const isTotal = variant === "total";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl px-[15px] py-3",
        isTotal
          ? "border-[1.5px] border-qp-shield-line bg-qp-selected"
          : "border border-line bg-card",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2 text-[13px]",
          isTotal ? "font-semibold text-qp-deep" : "text-ink",
        )}
      >
        {variant !== "total" ? (
          <span
            className={cn(
              "size-2.5 rounded-sm",
              variant === "objective"
                ? "bg-moss"
                : "bg-[repeating-linear-gradient(45deg,#7fb39f,#7fb39f_3px,#9cc6b6_3px,#9cc6b6_6px)]",
            )}
            aria-hidden
          />
        ) : null}
        {label}
      </span>
      <span className={cn("font-serif text-base text-ink", amountClassName)}>
        {amount}
      </span>
    </div>
  );
}

function LegendSwatch({
  variant,
  label,
  labelDesktop,
}: {
  variant: "objective" | "additional";
  label: string;
  labelDesktop: string;
}) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-qp-text md:text-[13px]">
      <span
        className={cn(
          "size-2.5 rounded-sm md:size-[11px]",
          variant === "objective"
            ? "bg-moss"
            : "bg-[repeating-linear-gradient(45deg,#7fb39f,#7fb39f_3px,#9cc6b6_3px,#9cc6b6_6px)]",
        )}
        aria-hidden
      />
      <span className="md:hidden">{label}</span>
      <span className="hidden md:inline">{labelDesktop}</span>
    </span>
  );
}

function MetricCard({
  label,
  hint,
  amount,
  variant,
  amountClassName,
}: {
  label: string;
  hint: string;
  amount: string;
  variant: "objective" | "additional" | "total";
  amountClassName?: string;
}) {
  const isTotal = variant === "total";

  return (
    <article
      className={cn(
        "rounded-xl border p-4 md:p-[17px]",
        isTotal
          ? "border-[1.5px] border-qp-shield-line bg-qp-selected"
          : "border-line/70 bg-card",
      )}
    >
      <div
        className={cn(
          "mb-2 flex items-center gap-2 text-[12.5px]",
          isTotal ? "font-semibold text-qp-deep" : "text-mute",
        )}
      >
        {variant !== "total" ? (
          <span
            className={cn(
              "size-2.5 rounded-sm",
              variant === "objective"
                ? "bg-moss"
                : "bg-[repeating-linear-gradient(45deg,#7fb39f,#7fb39f_3px,#9cc6b6_3px,#9cc6b6_6px)]",
            )}
            aria-hidden
          />
        ) : null}
        {label}
      </div>
      <p
        className={cn(
          "font-serif text-2xl text-ink md:text-[26px]",
          amountClassName,
        )}
      >
        {amount}
      </p>
      <p
        className={cn("mt-1 text-xs", isTotal ? "text-qp-text" : "text-faint")}
      >
        {hint}
      </p>
    </article>
  );
}
