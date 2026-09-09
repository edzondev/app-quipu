"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { currencySymbolForCode, DEFAULT_CURRENCY } from "@/core/constants";
import { useDashboardSummary } from "@/modules/dashboard/hooks/use-dashboard-summary";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import {
  EXPENSE_FLOW_TITLE,
  EXPENSE_VARIANT_B_TITLE_PREFIX,
} from "../constants";
import { useExpenseRegister } from "../hooks/use-expense-register-context";
import { extractRecentExpenseEnvelopes } from "../lib/envelopeSuggestion";
import type { ExpenseFlowStep, ExpenseRegisterResult } from "../types";
import { ExpenseConfirmation } from "./expense-confirmation";
import { ExpenseRegisterForm } from "./expense-register-form";
import { ExpenseRegisterShell, FlowProgress } from "./expense-register-shell";

export function ExpenseRegisterFlow() {
  const { isOpen, close, options, openNonce } = useExpenseRegister();

  return (
    <ExpenseRegisterFlowSession
      key={openNonce}
      isOpen={isOpen}
      close={close}
      options={options}
    />
  );
}

type SessionProps = {
  isOpen: boolean;
  close: () => void;
  options: ReturnType<typeof useExpenseRegister>["options"];
};

function ExpenseRegisterFlowSession({ isOpen, close, options }: SessionProps) {
  const summary = useDashboardSummary();
  const registerExpense = useMutation(api.expenses.registerExpense);

  const [step, setStep] = useState<ExpenseFlowStep>("amount");
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<ExpenseRegisterResult | undefined>();

  const variant = options.variant ?? "fab";
  const preselectedEnvelope = options.preselectedEnvelope;
  const hasActiveCycle = Boolean(summary?.cycle);

  const recentEnvelopes = extractRecentExpenseEnvelopes(
    summary?.movements ?? [],
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      close();
    }
  }

  const currencyCode = summary?.profile.currencyCode ?? DEFAULT_CURRENCY.code;
  const currencySymbol = currencySymbolForCode(currencyCode);

  const title =
    variant === "envelope" && preselectedEnvelope
      ? `${EXPENSE_VARIANT_B_TITLE_PREFIX} ${ENVELOPE_LABELS[preselectedEnvelope]}`
      : EXPENSE_FLOW_TITLE;

  return (
    <ExpenseRegisterShell
      open={isOpen && hasActiveCycle}
      onOpenChange={handleOpenChange}
      title={step === "success" ? EXPENSE_FLOW_TITLE : title}
      progress={step === "success" ? null : <FlowProgress step={step} />}
    >
      {/* viewKey estable: key={step} remontaría el form y resetearía el monto */}
      <AnimatedView viewKey="expense-register-flow" aria-live="polite">
        {step === "success" && result ? (
          <ExpenseConfirmation
            amountCents={result.amount}
            envelopeType={result.envelopeType}
            remainingAmount={result.remainingAmount}
            dailyDeltaCents={result.dailyDeltaCents}
            dailyAfterCents={result.dailyAfterCents}
            daysRemainingInCycle={result.daysRemainingInCycle}
            currencyCode={currencyCode}
            startedAt={startedAt}
            onClose={close}
          />
        ) : (
          <ExpenseRegisterForm
            step={step}
            setStep={setStep}
            variant={variant}
            preselectedEnvelope={preselectedEnvelope}
            recentEnvelopes={recentEnvelopes}
            currencySymbol={currencySymbol}
            registerExpense={registerExpense}
            onSuccess={(response) => {
              setResult(response);
              setStep("success");
            }}
          />
        )}
      </AnimatedView>
    </ExpenseRegisterShell>
  );
}
