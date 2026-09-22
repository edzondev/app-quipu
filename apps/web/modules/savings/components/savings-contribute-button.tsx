"use client";

import { useMutation } from "convex/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
  CONTRIBUTE_NO_FUNDS,
  CONTRIBUTE_SUCCESS_PREFIX,
  EMERGENCY_FUND_CONTRIBUTE_CTA,
} from "../constants";

type Props = {
  subEnvelopeId: Id<"subEnvelopes">;
  subEnvelopeLabel?: string;
  isEmergencyFund?: boolean;
  availableToContributeCents: number;
  currencyCode: string;
  className?: string;
  fullWidth?: boolean;
};

export function SavingsContributeButton({
  subEnvelopeId,
  subEnvelopeLabel,
  isEmergencyFund = false,
  availableToContributeCents,
  currencyCode,
  className,
  fullWidth = true,
}: Props) {
  const contribute = useMutation(api.savings.contributeToSubEnvelope);
  const [isSubmitting, startContribute] = useTransition();

  function handleContribute() {
    if (availableToContributeCents <= 0) {
      toast.message(CONTRIBUTE_NO_FUNDS);
      return;
    }

    startContribute(async () => {
      try {
        const result = await contribute({ subEnvelopeId });
        track(AnalyticsEvents.SAVINGS_CONTRIBUTION_COMPLETED, {
          amount: result.amount,
          source_envelope: "needs",
          goal_id: subEnvelopeId,
          goal_label: subEnvelopeLabel,
          is_emergency_fund: isEmergencyFund,
        });
        toast.success(
          `${CONTRIBUTE_SUCCESS_PREFIX} Moviste ${formatCents(result.amount, {
            currency: currencyCode,
          })} a tu fondo.`,
        );
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  return (
    <Button
      type="button"
      className={cn(fullWidth && "w-full", className)}
      disabled={isSubmitting || availableToContributeCents <= 0}
      onClick={handleContribute}
    >
      {EMERGENCY_FUND_CONTRIBUTE_CTA}
    </Button>
  );
}
