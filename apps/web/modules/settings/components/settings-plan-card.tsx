"use client";

import { CheckoutLink } from "@convex-dev/polar/react";
import { useAction } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { AnalyticsEvents, track } from "@/core/analytics";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  type BillingInterval,
  getPlusAnnualSavingsPercent,
  getPlusPriceQuote,
  PLUS_BILLING_INTERVAL_LABELS,
  PLUS_CHECKOUT_CTA,
} from "@/shared/constants/plan";
import { cn } from "@/shared/lib/utils";
import { withPending } from "@/shared/lib/with-pending";
import {
  SETTINGS_PLAN_ACTIVE_BADGE,
  SETTINGS_PLAN_BILLING_UNAVAILABLE,
  SETTINGS_PLAN_CURRENT_LABEL,
  SETTINGS_PLAN_FREE_BODY,
  SETTINGS_PLAN_FREE_NAME,
  SETTINGS_PLAN_LABEL,
  SETTINGS_PLAN_MANAGE,
  SETTINGS_PLAN_PLUS_NAME,
  SETTINGS_PLAN_PLUS_OFFER_LABEL,
  SETTINGS_PLAN_PREPARING,
  SETTINGS_PLAN_TAX_INCLUDED,
  SETTINGS_PLAN_VALUE_BULLETS,
  SETTINGS_PLAN_VALUE_HEADING,
} from "../constants";
import type { SettingsSubscriptionOverview } from "../types";

type Props = {
  subscription: SettingsSubscriptionOverview;
  className?: string;
};

/** Polar lazy checkout uses `window.location.href` as successUrl at click time. */
function primeCheckoutSuccessReturnUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("checkout", "success");
  url.hash = "plan";
  window.history.replaceState({}, "", url.toString());
}

export function SettingsPlanCard({ subscription, className }: Props) {
  const isPremium = subscription.plan === "premium";
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const quote = getPlusPriceQuote(subscription.currencyCode, billingInterval);
  const savingsPct = getPlusAnnualSavingsPercent(subscription.currencyCode);

  const productId =
    billingInterval === "monthly"
      ? subscription.plusProductIds.monthly
      : subscription.plusProductIds.yearly;
  const canCheckout = subscription.checkoutAvailable && Boolean(productId);

  const generatePortal = useAction(api.polar.generateCustomerPortalUrl);
  const [portalPending, setPortalPending] = useState(false);
  const searchParams = useSearchParams();
  const paywallTracked = useRef(false);
  const checkoutCompletedTracked = useRef(false);

  useEffect(() => {
    if (isPremium || paywallTracked.current) return;
    paywallTracked.current = true;
    track(AnalyticsEvents.PLUS_PAYWALL_VIEWED, {
      surface: "settings_plan",
      plan: "free",
    });
  }, [isPremium]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    if (checkoutCompletedTracked.current) return;
    checkoutCompletedTracked.current = true;
    track(AnalyticsEvents.PLUS_CHECKOUT_COMPLETED, {
      interval: billingInterval,
      currency: subscription.currencyCode,
    });
  }, [searchParams, billingInterval, subscription.currencyCode]);

  const upgradeButtonClass = cn(
    buttonVariants({ variant: "default", size: "default" }),
    "h-11 w-full justify-center rounded-[12px] bg-ink text-[13.5px] font-semibold text-canvas no-underline hover:bg-ink/90 sm:w-auto sm:min-w-[14rem]",
  );

  const manageButtonClass = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "h-10 w-full justify-center rounded-[11px] border-line text-ink-secondary no-underline sm:w-auto",
  );

  const onManage = () => {
    track(AnalyticsEvents.PLUS_PORTAL_OPENED, {});
    void withPending(setPortalPending, async () => {
      try {
        const { url } = await generatePortal({
          returnUrl: `${window.location.origin}/settings#plan`,
        });
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        // Portal errors surface via Polar; keep button usable.
      }
    });
  };

  const handleCheckoutStart = () => {
    primeCheckoutSuccessReturnUrl();
    track(AnalyticsEvents.PLUS_CHECKOUT_STARTED, {
      interval: billingInterval,
      currency: subscription.currencyCode,
    });
  };

  return (
    <section
      id="plan"
      className={cn(
        "scroll-mt-6 overflow-hidden rounded-xl border border-line/70 bg-card",
        className,
      )}
    >
      <div className="border-b border-line/50 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12.5px] font-medium text-ink-secondary">
            {SETTINGS_PLAN_LABEL}
          </span>
          {isPremium ? (
            <span className="rounded-full bg-qp-soft px-2.5 py-0.5 text-[10.5px] font-semibold text-qp-deep">
              {SETTINGS_PLAN_ACTIVE_BADGE}
            </span>
          ) : (
            <span className="rounded-full border border-line-soft bg-canvas px-2.5 py-0.5 text-[10.5px] font-medium text-mute">
              {SETTINGS_PLAN_CURRENT_LABEL}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h2 className="font-serif text-[22px] leading-none text-ink md:text-[24px]">
            {isPremium ? SETTINGS_PLAN_PLUS_NAME : SETTINGS_PLAN_FREE_NAME}
          </h2>
          {!isPremium ? (
            <span className="text-[13px] font-medium text-mute">Gratis</span>
          ) : null}
          {isPremium && subscription.priceDisplay ? (
            <span className="text-[13px] text-mute">
              {subscription.priceDisplay}
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 max-w-prose text-[12.5px] leading-snug text-mute-subtle">
          {isPremium
            ? (subscription.renewalSummary ?? SETTINGS_PLAN_FREE_BODY)
            : SETTINGS_PLAN_FREE_BODY}
        </p>
      </div>

      {isPremium ? (
        <SettingsPlanManage
          portalPending={portalPending}
          onManage={onManage}
          manageButtonClass={manageButtonClass}
        />
      ) : (
        <SettingsPlanUpgrade
          subscription={subscription}
          quote={quote}
          savingsPct={savingsPct}
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          canCheckout={canCheckout}
          productId={productId}
          upgradeButtonClass={upgradeButtonClass}
          onCheckoutStart={handleCheckoutStart}
        />
      )}
    </section>
  );
}

function SettingsPlanManage({
  portalPending,
  onManage,
  manageButtonClass,
}: {
  portalPending: boolean;
  onManage: () => void;
  manageButtonClass: string;
}) {
  return (
    <div className="px-5 py-5 md:px-6">
      <p className="text-[11.5px] text-faint">{SETTINGS_PLAN_TAX_INCLUDED}</p>
      <div className="mt-4">
        <button
          type="button"
          disabled={portalPending}
          onClick={onManage}
          className={manageButtonClass}
          aria-busy={portalPending}
        >
          {portalPending ? SETTINGS_PLAN_PREPARING : SETTINGS_PLAN_MANAGE}
        </button>
      </div>
    </div>
  );
}

function SettingsPlanUpgrade({
  subscription,
  quote,
  savingsPct,
  billingInterval,
  setBillingInterval,
  canCheckout,
  productId,
  upgradeButtonClass,
  onCheckoutStart,
}: {
  subscription: SettingsSubscriptionOverview;
  quote: ReturnType<typeof getPlusPriceQuote>;
  savingsPct: number;
  billingInterval: BillingInterval;
  setBillingInterval: (interval: BillingInterval) => void;
  canCheckout: boolean;
  productId: string | null | undefined;
  upgradeButtonClass: string;
  onCheckoutStart: () => void;
}) {
  return (
    <div className="relative px-5 py-5 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-qp-deep">
            {SETTINGS_PLAN_PLUS_OFFER_LABEL}
          </p>
          <p className="mt-2 font-serif text-[32px] leading-none tracking-tight text-ink md:text-[36px]">
            {quote.priceInline}
          </p>
          <p className="mt-2 text-[12.5px] text-mute">
            {quote.priceLabel} · {quote.billingCadence}
          </p>
          <p className="mt-1 text-[11.5px] text-faint">
            {SETTINGS_PLAN_TAX_INCLUDED}
          </p>
        </div>

        <fieldset className="m-0 flex w-full shrink-0 items-center gap-1 rounded-full border border-line bg-canvas p-0.5 sm:mt-1 sm:w-auto sm:inline-flex">
          <legend className="sr-only">Intervalo de facturación</legend>
          {(["monthly", "yearly"] as const).map((id) => {
            const selected = billingInterval === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => setBillingInterval(id)}
                className={cn(
                  "min-h-9 flex-1 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors sm:min-h-0 sm:flex-none",
                  selected ? "bg-ink text-canvas" : "text-mute hover:text-ink",
                )}
              >
                {PLUS_BILLING_INTERVAL_LABELS[id]}
                {id === "yearly" ? (
                  <span
                    className={cn(
                      "ml-1.5 text-[10px]",
                      selected ? "text-canvas/75" : "text-qp-deep",
                    )}
                  >
                    −{savingsPct}%
                  </span>
                ) : null}
              </button>
            );
          })}
        </fieldset>
      </div>

      <div className="mt-6">
        <p className="font-serif text-[17px] leading-snug text-ink md:text-[18px]">
          {SETTINGS_PLAN_VALUE_HEADING}
        </p>
        <ul className="mt-3.5 space-y-2.5">
          {SETTINGS_PLAN_VALUE_BULLETS.map((line) => (
            <li
              key={line}
              className="flex gap-2.5 text-[13.5px] leading-snug text-ink-secondary"
            >
              <span
                aria-hidden
                className="mt-[7px] size-1 shrink-0 rounded-full bg-qp"
              />
              <span className="min-w-0">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        {canCheckout && productId ? (
          <span
            className="inline-flex w-full sm:w-auto"
            onPointerDownCapture={onCheckoutStart}
          >
            <CheckoutLink
              polarApi={{
                generateCheckoutLink: api.polar.generateCheckoutLink,
              }}
              productIds={[productId]}
              lazy
              embed={false}
              locale="es"
              className={upgradeButtonClass}
            >
              {PLUS_CHECKOUT_CTA} · {quote.priceLabel}
            </CheckoutLink>
          </span>
        ) : subscription.checkoutAvailable ? (
          <button type="button" disabled className={upgradeButtonClass}>
            {SETTINGS_PLAN_PREPARING}
          </button>
        ) : (
          <p className="text-[12.5px] text-mute-subtle">
            {SETTINGS_PLAN_BILLING_UNAVAILABLE}
          </p>
        )}
      </div>
    </div>
  );
}
