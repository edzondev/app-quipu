"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { api } from "@/convex/_generated/api";
import { Skeleton } from "@/core/components/ui/skeleton";
import { usePayday } from "../hooks/use-payday";
import AlreadyProcessedView from "./already-processed-view";
import AssigningStep from "./assigning-step";
import DoneStep from "./done-step";
import NextPaydayView from "./next-payday-view";
import PaydayStep from "./payday-step";

type Props = {
  preloadedPaydayStatus: Preloaded<typeof api.payday.getPaydayStatus>;
};

type PaydayStatusSnapshot = {
  isPayday: boolean;
  hasProcessedCurrentPayday: boolean;
  nextPaydayDate: string;
  daysUntilNextPayday: number;
  profile: {
    currencySymbol: string;
    monthlyIncome: number;
    allocationNeeds: number;
    allocationWants: number;
    allocationSavings: number;
    payFrequency: "monthly" | "biweekly";
    paydays: number[];
  };
};

export default function PaydayView({ preloadedPaydayStatus }: Props) {
  const status = usePreloadedQuery(preloadedPaydayStatus);
  const { step, handleAssign } = usePayday();

  if (!status) {
    return (
      <output
        className="flex flex-col items-center justify-center gap-8 py-20"
        aria-live="polite"
        aria-busy="true"
        aria-label="Cargando día de pago"
      >
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="mx-auto w-full max-w-md space-y-3 text-center">
          <Skeleton className="mx-auto h-9 w-56 rounded-md sm:w-64" />
          <Skeleton className="mx-auto h-5 w-full rounded-md" />
          <Skeleton className="mx-auto hidden h-5 w-[88%] rounded-md sm:block" />
        </div>
        <Skeleton className="h-11 w-48 rounded-lg" />
      </output>
    );
  }

  return (
    <PaydayContent status={status} step={step} handleAssign={handleAssign} />
  );
}

function PaydayContent({
  status,
  step,
  handleAssign,
}: {
  status: PaydayStatusSnapshot;
  step: ReturnType<typeof usePayday>["step"];
  handleAssign: ReturnType<typeof usePayday>["handleAssign"];
}) {
  const {
    isPayday,
    hasProcessedCurrentPayday,
    nextPaydayDate,
    daysUntilNextPayday,
    profile,
  } = status;

  const {
    currencySymbol,
    monthlyIncome,
    allocationNeeds,
    allocationWants,
    allocationSavings,
    payFrequency,
  } = profile;

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
