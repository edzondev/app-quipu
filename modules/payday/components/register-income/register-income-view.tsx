"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { api } from "@/convex/_generated/api";
import { useRegisterIncome } from "@/modules/payday/hooks/use-register-income";
import AssigningStep from "./assigning-step";
import DoneStep from "./done-step";
import IncomeInputStep from "./income-input-step";

type Props = {
  preloadedProfile: Preloaded<typeof api.profiles.getMyProfile>;
};

export default function RegisterIncomeView({ preloadedProfile }: Props) {
  const profile = usePreloadedQuery(preloadedProfile);
  const { step, amount, handleAssign } = useRegisterIncome();

  if (!profile) return null;

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
