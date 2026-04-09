"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { analytics } from "@/lib/analytics";
import { MIN_ASSIGNING_MS, wait } from "../lib/payday-utils";

type PaydayStep = "idle" | "assigning" | "done";

export function usePayday() {
  const [step, setStep] = useState<PaydayStep>("idle");
  const processPayday = useMutation(api.payday.processPayday);

  const isProcessing = step === "assigning";

  const handleAssign = async () => {
    setStep("assigning");
    try {
      const [distributionNumber] = await Promise.all([
        processPayday(),
        wait(MIN_ASSIGNING_MS),
      ]);
      analytics.capture.distribution_completed({
        distribution_number: distributionNumber,
      });
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
