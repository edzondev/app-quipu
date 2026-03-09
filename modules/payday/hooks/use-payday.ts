"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

type PaydayStep = "idle" | "assigning" | "done";

const MIN_ASSIGNING_MS = 3200;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function usePayday() {
  const [step, setStep] = useState<PaydayStep>("idle");
  const processPayday = useMutation(api.payday.processPayday);

  const isProcessing = step === "assigning";

  const handleAssign = async () => {
    setStep("assigning");
    try {
      await Promise.all([processPayday(), wait(MIN_ASSIGNING_MS)]);
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
  };
}
