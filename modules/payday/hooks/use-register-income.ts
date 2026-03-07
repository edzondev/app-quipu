"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

export type RegisterIncomeStep = "idle" | "assigning" | "done";

const MIN_ASSIGNING_MS = 3200;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function useRegisterIncome() {
  const [step, setStep] = useState<RegisterIncomeStep>("idle");
  const [amount, setAmount] = useState(0);
  const registerIncome = useMutation(api.payday.registerIncome);

  const isProcessing = step === "assigning";

  const handleAssign = async (incomeAmount: number) => {
    setAmount(incomeAmount);
    setStep("assigning");
    try {
      await Promise.all([
        registerIncome({ amount: incomeAmount }),
        wait(MIN_ASSIGNING_MS),
      ]);
      setStep("done");
    } catch (err) {
      setStep("idle");
      if (err instanceof ConvexError) {
        toast.error(String(err.data));
      } else {
        toast.error("Ocurrió un error al registrar el ingreso.");
      }
    }
  };

  return {
    step,
    amount,
    isProcessing,
    handleAssign,
  };
}
