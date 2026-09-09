import Link from "next/link";
import { AnalyticsEvents, track } from "@/core/analytics";
import { formatCents } from "@/shared/lib/money";
import {
  HERO_AVAILABLE_LABEL,
  HERO_CORRECT_CTA,
  HERO_CORRECT_HINT,
  HERO_CYCLE_HEALTH,
  HERO_DAYS_REMAINING,
  HERO_LIQUIDITY_RESERVED,
  HERO_LIQUIDITY_SPENDABLE,
  HERO_LIQUIDITY_UNALLOCATED,
  HERO_NEEDS_REVIEW_BANNER,
  HERO_NEEDS_REVIEW_CTA,
  STATUS_BADGE_LABELS,
} from "../constants";
import { clampPercent, getStatusBadgeClasses } from "../lib/dashboard-math";
import type {
  DashboardCycle,
  DashboardHero as DashboardHeroData,
} from "../types";

type Props = {
  hero: DashboardHeroData;
  cycle: DashboardCycle;
  currencyCode: string;
};

export function DashboardHero({ hero, cycle, currencyCode }: Props) {
  const badgeClasses = getStatusBadgeClasses(hero.statusBadge);
  const progressPercent = clampPercent(cycle.progressPercent);
  const reservedCents = hero.reservedCents ?? 0;
  const unallocatedCents = hero.unallocatedCents ?? 0;
  const spendableCents = hero.spendableCents ?? 0;
  const showLiquidity =
    reservedCents > 0 || unallocatedCents > 0 || spendableCents > 0;
  const needsReview = cycle.needsReview === true;

  function trackCorrectCta(
    source: "dashboard_banner" | "dashboard_hint",
  ): void {
    track(AnalyticsEvents.ALLOCATION_CORRECT_CTA_CLICKED, {
      source,
      cycle_id: cycle.id,
      needs_review: needsReview,
    });
  }

  return (
    <section
      aria-labelledby="dashboard-hero-title"
      className="mb-2.5 rounded-xl border border-line/70 bg-linear-to-tr from-qp-gradient to-qp-gradient/10 p-3.5 shadow-[0_1px_2px_color-mix(in_oklch,var(--qp-ink)_3%,transparent)] md:mb-3.5 md:p-7"
    >
      {needsReview ? (
        <div className="mb-3 flex flex-col gap-2 rounded-[12px] border border-clay/30 bg-card/80 px-3 py-2.5 md:flex-row md:items-center md:justify-between">
          <p className="text-[12.5px] text-ink-secondary">
            {HERO_NEEDS_REVIEW_BANNER}
          </p>
          <Link
            href="/cycle/correct"
            className="text-[12.5px] font-semibold text-qp-deep underline-offset-2 hover:underline"
            onClick={() => trackCorrectCta("dashboard_banner")}
          >
            {HERO_NEEDS_REVIEW_CTA}
          </Link>
        </div>
      ) : (
        <p className="mb-3 text-[12px] text-mute md:text-[12.5px]">
          {HERO_CORRECT_HINT}{" "}
          <Link
            href="/cycle/correct"
            className="font-semibold text-qp-deep underline-offset-2 hover:underline"
            onClick={() => trackCorrectCta("dashboard_hint")}
          >
            {HERO_CORRECT_CTA}
          </Link>
        </p>
      )}
      <div className="flex flex-col md:flex-row md:gap-9">
        <div className="min-w-0 flex-[1.3]">
          <div className="mb-1.5 flex items-center gap-2 md:mb-2">
            <span className="size-1.5 rounded-full bg-qp" aria-hidden />
            <p
              id="dashboard-hero-title"
              className="font-mono text-[10px] uppercase tracking-widest text-qp-deep md:text-[11px]"
            >
              {HERO_AVAILABLE_LABEL}
            </p>
          </div>
          <p className="font-serif text-[40px] font-medium leading-none tracking-[-0.02em] text-ink md:text-[64px] md:tracking-[-0.015em]">
            {formatCents(hero.displayDailyCents, { currency: currencyCode })}
          </p>
          <p className="mt-2 max-w-md text-xs leading-snug text-ink-secondary md:mt-3 md:max-w-sm md:text-sm md:leading-relaxed md:text-[14.5px]">
            {hero.bodyCopy ? (
              hero.bodyCopy
            ) : (
              <>
                {hero.rateLine}{" "}
                <span className="font-semibold text-qp-deep">
                  {hero.validationCopy}
                </span>
              </>
            )}
          </p>

          {showLiquidity ? (
            <dl className="mt-3 grid grid-cols-3 gap-2 md:mt-4">
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">
                  {HERO_LIQUIDITY_SPENDABLE}
                </dt>
                <dd className="font-semibold text-ink">
                  {formatCents(spendableCents, { currency: currencyCode })}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">
                  {HERO_LIQUIDITY_RESERVED}
                </dt>
                <dd className="font-semibold text-ink">
                  {formatCents(reservedCents, { currency: currencyCode })}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">
                  {HERO_LIQUIDITY_UNALLOCATED}
                </dt>
                <dd className="font-semibold text-ink">
                  {formatCents(unallocatedCents, { currency: currencyCode })}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-3 md:hidden">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs text-ink-secondary">
                {cycle.daysRemaining} días restantes
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeClasses.container}`}
              >
                <span
                  className={`size-1.5 rounded-full ${badgeClasses.dot}`}
                  aria-hidden
                />
                {STATUS_BADGE_LABELS[hero.statusBadge]}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-[4px] bg-qp-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <div
                className="h-full rounded-[4px] bg-qp transition-[width]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hidden flex-1 flex-col justify-center border-l border-qp-border pl-8 md:flex">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[12.5px] font-medium text-ink-secondary">
              {HERO_DAYS_REMAINING}
            </span>
            <span className="font-serif text-[19px] text-ink">
              {cycle.daysRemaining}
            </span>
          </div>
          <div
            className="mb-4 h-2 overflow-hidden rounded-[5px] bg-qp-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="h-full rounded-[5px] bg-qp transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12.5px] font-medium text-ink-secondary">
              {HERO_CYCLE_HEALTH}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold ${badgeClasses.container}`}
            >
              <span
                className={`size-1.5 rounded-full ${badgeClasses.dot}`}
                aria-hidden
              />
              {STATUS_BADGE_LABELS[hero.statusBadge]}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
