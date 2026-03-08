"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
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
  const { step, handleAssign } = usePayday();

  if (!status) return null;

  const { isPayday, hasProcessedCurrentPayday, nextPaydayDate, daysUntilNextPayday, profile } =
    status;

  const { currencySymbol, monthlyIncome, allocationNeeds, allocationWants, allocationSavings, payFrequency } =
    profile;

  // While an animation is in progress, always show it through to completion
  if (step === "assigning") {
    return (
      <section className="animate-in fade-in duration-200">
        <AssigningStep
          currencySymbol={currencySymbol}
          monthlyIncome={monthlyIncome}
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
        monthlyIncome={monthlyIncome}
        onAssign={handleAssign}
      />
    </section>
  );
}
