import { api } from "@quipu/convex-api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import type { DashboardSummary } from "@/modules/home/types";
import type { IncomeEventArgs } from "./income-payload";
import type { AllocationWeights, ExtraordinaryRules } from "./types";
import { uncoveredCommitmentsCents } from "./uncovered";

const DEFAULT_WEIGHTS: AllocationWeights = {
  allocationNeeds: 50,
  allocationWants: 30,
  allocationSavings: 20,
};

export function useRegisterIncome() {
  const summary = useQuery(api.dashboard.getSummary, {});
  const profile = useQuery(api.profiles.getMyProfile, {});
  const createIncomeEvent = useMutation(api.incomeEvents.createIncomeEvent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weights: AllocationWeights = {
    allocationNeeds:
      profile?.allocationNeeds ?? DEFAULT_WEIGHTS.allocationNeeds,
    allocationWants:
      profile?.allocationWants ?? DEFAULT_WEIGHTS.allocationWants,
    allocationSavings:
      profile?.allocationSavings ?? DEFAULT_WEIGHTS.allocationSavings,
  };

  const commitmentsRemainingCents = uncoveredCommitmentsCents(
    (summary as DashboardSummary | null | undefined)?.commitments,
  );

  const extraordinaryRules = profile?.extraordinaryRules as
    | Partial<ExtraordinaryRules>
    | undefined;

  const submit = useCallback(
    async (args: IncomeEventArgs) => {
      setSubmitting(true);
      setError(null);
      try {
        await createIncomeEvent({
          amount: args.amount,
          source: args.source,
          description: args.description,
          occurredAt: args.occurredAt,
          incomeKind: args.incomeKind,
          ...(args.extraordinaryType
            ? { extraordinaryType: args.extraordinaryType }
            : {}),
          ...(args.extraordinaryLabel
            ? { extraordinaryLabel: args.extraordinaryLabel }
            : {}),
          ...(args.distributionPolicy
            ? { distributionPolicy: args.distributionPolicy }
            : {}),
          allocation: {
            reservations: args.allocation.reservations.map((row) => ({
              commitmentId: row.commitmentId as never,
              amountCents: row.amountCents,
            })),
            envelopes: args.allocation.envelopes,
            savingsContributions: args.allocation.savingsContributions.map(
              (row) => ({
                amountCents: row.amountCents,
                kind: row.kind,
                subEnvelopeId: row.subEnvelopeId as never,
              }),
            ),
            leaveUnallocatedCents: args.allocation.leaveUnallocatedCents,
          },
        });
        return true;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo registrar el ingreso. Intenta de nuevo.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [createIncomeEvent],
  );

  return {
    weights,
    commitmentsRemainingCents,
    extraordinaryRules,
    submit,
    submitting,
    error,
  };
}
