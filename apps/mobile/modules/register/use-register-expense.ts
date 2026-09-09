import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import type { ExpenseEnvelope } from "./types";

export type ExpenseRegisterOutcome = {
  expenseId: string;
  envelopeType: ExpenseEnvelope;
  amount: number;
  remainingAmount: number;
  spendableCents: number;
  dailyBeforeCents: number;
  dailyAfterCents: number;
  dailyDeltaCents: number;
  daysRemainingInCycle: number;
};

export function useRegisterExpense() {
  const registerExpense = useMutation(api.expenses.registerExpense);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (input: {
      amountCents: number;
      description: string;
      envelopeType: ExpenseEnvelope;
    }): Promise<
      { ok: true; result: ExpenseRegisterOutcome } | { ok: false }
    > => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await registerExpense({
          amount: input.amountCents,
          description: input.description.trim() || "Gasto",
          envelopeType: input.envelopeType,
        });
        return { ok: true, result };
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo registrar el gasto. Intenta de nuevo.",
        );
        return { ok: false };
      } finally {
        setSubmitting(false);
      }
    },
    [registerExpense],
  );

  return { submit, submitting, error };
}
