"use client";

import { usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import type { api } from "@/convex/_generated/api";
import { useRescue } from "../hooks/use-rescue";
import DoneStep from "./done-step";
import SelectActionStep from "./select-action-step";

interface RescueViewProps {
  preloaded: Preloaded<typeof api.rescue.getRescueStatus>;
}

export default function RescueView({ preloaded }: RescueViewProps) {
  const data = usePreloadedQuery(preloaded);
  const {
    step,
    selectedActionId,
    setSelectedActionId,
    handleApply,
    isApplying,
  } = useRescue();

  if (step === "done") {
    return <DoneStep />;
  }

  if (!data || !data.isInRescue) {
    return null;
  }

  const envelope = data.envelope as "needs" | "wants" | null;

  return (
    <SelectActionStep
      data={{ ...data, envelope }}
      selectedActionId={selectedActionId}
      setSelectedActionId={setSelectedActionId}
      handleApply={handleApply}
      isApplying={isApplying}
    />
  );
}
