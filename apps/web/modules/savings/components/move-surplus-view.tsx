"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { fromConvexError } from "@/core/errors";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { moveSurplusToSavings, useMoveSurplusToSavings } from "../actions";
import {
  MOVE_SURPLUS_NO_CYCLE_BODY,
  MOVE_SURPLUS_NO_SURPLUS,
  MOVE_SURPLUS_PAGE_BACK,
  MOVE_SURPLUS_PAGE_SUBTITLE,
  MOVE_SURPLUS_PAGE_TITLE,
} from "../constants";
import {
  moveSurplusFormToMutationArgs,
  type SurplusFromEnvelope,
} from "../schemas";
import { MoveSurplusForm } from "./move-surplus-form";

type Props = {
  initialFromEnvelope?: SurplusFromEnvelope;
  initialAmountCents?: number;
  initialDestinationId?: Id<"subEnvelopes">;
};

function totalSurplusAvailable(context: {
  sources: {
    needs: { availableCents: number };
    wants: { availableCents: number };
    extraordinary: { availableCents: number };
  };
}): number {
  return (
    context.sources.needs.availableCents +
    context.sources.wants.availableCents +
    context.sources.extraordinary.availableCents
  );
}

export function MoveSurplusView({
  initialFromEnvelope,
  initialAmountCents,
  initialDestinationId,
}: Props) {
  const router = useRouter();
  const context = useQuery(api.savings.getMoveSurplusContext, {});
  const moveMutation = useMoveSurplusToSavings();
  const [isSubmitting, startSubmit] = useTransition();

  if (context === undefined) {
    return <MoveSurplusSkeleton />;
  }

  if (context === null) {
    return (
      <AppPageShell maxWidth="2xl" breadcrumbs="auto">
        <p className="text-sm text-mute">{MOVE_SURPLUS_NO_CYCLE_BODY}</p>
        <Link
          href="/income/register"
          className={cn(buttonVariants(), "mt-4 inline-flex")}
        >
          Registrar ingreso
        </Link>
      </AppPageShell>
    );
  }

  if (totalSurplusAvailable(context) <= 0) {
    return (
      <AppPageShell
        maxWidth="2xl"
        breadcrumbs="auto"
        title={MOVE_SURPLUS_PAGE_TITLE}
      >
        <p className="text-sm text-mute">{MOVE_SURPLUS_NO_SURPLUS}</p>
        <Link
          href="/savings"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-4 inline-flex",
          )}
        >
          {MOVE_SURPLUS_PAGE_BACK}
        </Link>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell
      maxWidth="2xl"
      breadcrumbs="auto"
      title={MOVE_SURPLUS_PAGE_TITLE}
      subtitle={MOVE_SURPLUS_PAGE_SUBTITLE}
    >
      <MoveSurplusForm
        currencyCode={context.currencyCode ?? DEFAULT_CURRENCY.code}
        sources={context.sources}
        destinations={context.destinations}
        initialFrom={initialFromEnvelope}
        initialAmountCents={initialAmountCents}
        initialDestinationId={initialDestinationId}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/savings")}
        onSubmit={(values) => {
          startSubmit(async () => {
            try {
              const result = await moveSurplusToSavings(
                moveMutation,
                moveSurplusFormToMutationArgs(values),
              );
              track(AnalyticsEvents.ADDITIONAL_SAVINGS_ADDED, {
                amount: result.amount,
                source: values.fromSource,
              });
              const params = new URLSearchParams({
                moved: String(result.amount),
                objective: String(result.savingsObjectiveCents),
                additional: String(result.savingsAdditionalCents),
                total: String(result.savingsTotalCents),
                needs: String(result.allocationNeeds),
                wants: String(result.allocationWants),
                savings: String(result.allocationSavings),
              });
              router.push(`/savings/move/success?${params.toString()}`);
            } catch (error) {
              toast.error(fromConvexError(error).message);
            }
          });
        }}
      />
    </AppPageShell>
  );
}

function MoveSurplusSkeleton() {
  return (
    <AppPageShell maxWidth="2xl" breadcrumbs="auto">
      <Skeleton variant="line" className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-56 rounded-lg" />
      <Skeleton className="mt-6 h-48 w-full rounded-xl [animation-delay:150ms]" />
    </AppPageShell>
  );
}
