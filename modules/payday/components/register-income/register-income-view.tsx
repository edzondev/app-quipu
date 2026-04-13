"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useRegisterIncome } from "@/modules/payday/hooks/use-register-income";
import AssigningStep from "./assigning-step";
import DoneStep from "./done-step";
import IncomeInputStep from "./income-input-step";

type Props = {
  preloadedProfile: Preloaded<typeof api.profiles.getMyProfile>;
};

export default function RegisterIncomeView({ preloadedProfile }: Props) {
  const { step, amount, handleAssign } = useRegisterIncome();
  const profile = usePreloadedQuery(preloadedProfile);

  if (!profile) {
    return (
      <output
        className="flex w-full flex-col items-center gap-8 py-16"
        aria-live="polite"
        aria-busy="true"
        aria-label="Cargando registro de ingreso"
      >
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-16 w-full max-w-xs rounded-xl" />
        <Skeleton className="h-11 w-44 rounded-lg" />
      </output>
    );
  }

  return (
    <RegisterIncomeInner
      profile={profile}
      step={step}
      amount={amount}
      handleAssign={handleAssign}
    />
  );
}

function RegisterIncomeInner({
  profile,
  step,
  amount,
  handleAssign,
}: {
  profile: Doc<"profiles">;
  step: ReturnType<typeof useRegisterIncome>["step"];
  amount: ReturnType<typeof useRegisterIncome>["amount"];
  handleAssign: ReturnType<typeof useRegisterIncome>["handleAssign"];
}) {
  if (step === "assigning") {
    return (
      <AssigningStep
        currencySymbol={profile.currencySymbol}
        amount={amount}
        allocationNeeds={profile.allocationNeeds}
        allocationWants={profile.allocationWants}
        allocationSavings={profile.allocationSavings}
      />
    );
  }

  if (step === "done") {
    return <DoneStep />;
  }

  return (
    <IncomeInputStep
      currencySymbol={profile.currencySymbol}
      onSubmit={handleAssign}
    />
  );
}
