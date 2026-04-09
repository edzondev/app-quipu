"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { analytics } from "@/lib/analytics";

type RescueStep = "idle" | "applying" | "done";

export function useRescue() {
  const [step, setStep] = useState<RescueStep>("idle");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const applyRescueSolution = useMutation(api.rescue.applyRescueSolution);

  const handleApply = async () => {
    if (!selectedActionId) return;
    setStep("applying");
    try {
      await applyRescueSolution({
        actionId: selectedActionId as
          | "transfer_from_savings"
          | "pause_savings_contribution",
      });
      analytics.capture.rescue_mode_resolved();
      setStep("done");
    } catch (err) {
      setStep("idle");
      toast.error(
        err instanceof ConvexError
          ? String(err.data)
          : "Error al aplicar la solución.",
      );
    }
  };

  return {
    step,
    selectedActionId,
    setSelectedActionId,
    handleApply,
    isApplying: step === "applying",
  };
}
