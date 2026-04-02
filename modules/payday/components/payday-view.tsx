"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { usePayday } from "../hooks/use-payday";
import PaydayStep from "./payday-step";
import AssigningStep from "./assigning-step";
import DoneStep from "./done-step";
import NextPaydayView from "./next-payday-view";
import AlreadyProcessedView from "./already-processed-view";

type Props = {
  preloadedPaydayStatus: Preloaded<typeof api.payday.getPaydayStatus>;
};

export default function PaydayView({ preloadedPaydayStatus }: Props) {
  const status = usePreloadedQuery(preloadedPaydayStatus);
  const { step, handleAssign, assignedAmounts } = usePayday();

  // Income lives only in local state — never persisted to the server
  const [localIncome, setLocalIncome] = useState(0);

  if (!status) return null;

  const {
    isPayday,
    hasProcessedCurrentPayday,
    nextPaydayDate,
    daysUntilNextPayday,
    profile,
  } = status;

  const {
    currencySymbol,
    allocationNeeds,
    allocationWants,
    allocationSavings,
    payFrequency,
    fixedCommitmentsTotal,
  } = profile;

  // fixedCommitmentsTotal is the sum of all fixed commitments;
  // we treat them as split evenly between needs/wants for netIncome purposes.
  // The actual per-envelope breakdown is handled by calcularNetIncome in use-payday.
  const fixedNeeds = fixedCommitmentsTotal;
  const fixedWants = 0;

  const onAssign = (income: number) => {
    handleAssign(
      income,
      { needs: allocationNeeds, wants: allocationWants, savings: allocationSavings },
      fixedNeeds,
      fixedWants,
    );
  };

  // While an animation is in progress, always show it through to completion
  if (step === "assigning") {
    return (
      <section className="animate-in fade-in duration-200">
        <AssigningStep
          currencySymbol={currencySymbol}
          needsAmount={assignedAmounts.needs}
          wantsAmount={assignedAmounts.wants}
          savingsAmount={assignedAmounts.savings}
          allocationNeeds={allocationNeeds}
          allocationWants={allocationWants}
          allocationSavings={allocationSavings}
        />
      </section>
    );
  }

  if (step === "done") {
    return (
      <section className="animate-in fade-in duration-200">
        <DoneStep />
      </section>
    );
  }

  // step === "idle": gate on server state
  if (!isPayday) {
    return (
      <section className="animate-in fade-in duration-200">
        <NextPaydayView
          nextPaydayDate={nextPaydayDate}
          daysUntilNextPayday={daysUntilNextPayday}
          payFrequency={payFrequency}
        />
      </section>
    );
  }

  if (hasProcessedCurrentPayday) {
    return (
      <section className="animate-in fade-in duration-200">
        <AlreadyProcessedView />
      </section>
    );
  }

  return (
    <section className="animate-in fade-in duration-200">
      <PaydayStep
        currencySymbol={currencySymbol}
        localIncome={localIncome}
        onIncomeChange={setLocalIncome}
        allocationNeeds={allocationNeeds}
        allocationWants={allocationWants}
        allocationSavings={allocationSavings}
        fixedCommitmentsTotal={fixedCommitmentsTotal}
        onAssign={onAssign}
      />
    </section>
  );
}
