"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { calcularNetIncome, calcularSplit } from "@/lib/quipu-calculator";

type PaydayStep = "idle" | "assigning" | "done";

const MIN_ASSIGNING_MS = 3200;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function usePayday() {
  const [step, setStep] = useState<PaydayStep>("idle");
  const [assignedAmounts, setAssignedAmounts] = useState({
    needs: 0,
    wants: 0,
    savings: 0,
  });
  const processPayday = useMutation(api.payday.processPayday);

  const isProcessing = step === "assigning";

  const handleAssign = async (
    income: number,
    allocations: { needs: number; wants: number; savings: number },
    fixedNeeds: number,
    fixedWants: number,
  ) => {
    const netIncome = calcularNetIncome(income, fixedNeeds, fixedWants);
    const split = calcularSplit(netIncome, allocations);

    setAssignedAmounts(split);
    setStep("assigning");

    try {
      await Promise.all([
        processPayday({
          needsAmount: split.needs,
          wantsAmount: split.wants,
          savingsAmount: split.savings,
        }),
        wait(MIN_ASSIGNING_MS),
      ]);
      setStep("done");
    } catch (err) {
      setStep("idle");
      if (err instanceof ConvexError) {
        toast.error(String(err.data));
      } else {
        toast.error("Ocurrió un error al procesar el día de pago.");
      }
    }
  };

  return {
    step,
    isProcessing,
    handleAssign,
    assignedAmounts,
  };
}
