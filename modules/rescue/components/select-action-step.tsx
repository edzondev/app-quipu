"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  PauseCircle,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/core/components/ui/button";
import RescueActionCard from "./rescue-action-card";
import type { useRescue } from "../hooks/use-rescue";

type RescueData = {
  envelope: "needs" | "wants" | null;
  envelopeName: string | null;
  deficit: number;
  currencySymbol: string;
  availableActions: Array<{
    actionId: string;
    title: string;
    subtitle: string;
    amount: number;
    disabled: boolean;
    disabledReason?: string;
  }>;
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  transfer_from_savings: (
    <ArrowLeftRight className="w-5 h-5 text-destructive" />
  ),
  pause_savings_contribution: (
    <PauseCircle className="w-5 h-5 text-destructive" />
  ),
};

interface SelectActionStepProps {
  data: RescueData;
  selectedActionId: string | null;
  setSelectedActionId: (id: string) => void;
  handleApply: () => void;
  isApplying: boolean;
}

export default function SelectActionStep({
  data,
  selectedActionId,
  setSelectedActionId,
  handleApply,
  isApplying,
}: SelectActionStepProps) {
  const { currencySymbol, deficit, envelopeName, availableActions } = data;
  const selectedAction = availableActions.find(
    (a) => a.actionId === selectedActionId,
  );
  const isSelectedDisabled = selectedAction?.disabled ?? false;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 shrink-0">
          <TriangleAlert className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            Estás{" "}
            <span className="text-destructive font-bold">
              {currencySymbol} {deficit.toFixed(2)}
            </span>{" "}
            sobre tu límite este mes.
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {envelopeName} ha superado su presupuesto. Elige una acción para
            equilibrar.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {availableActions.map((action) => (
          <RescueActionCard
            key={action.actionId}
            actionId={action.actionId}
            title={action.title}
            subtitle={action.subtitle}
            icon={ACTION_ICONS[action.actionId]}
            selected={selectedActionId === action.actionId}
            onSelect={setSelectedActionId}
            disabled={action.disabled}
            disabledReason={action.disabledReason}
          />
        ))}
      </div>

      <Button
        variant="destructive"
        size="lg"
        disabled={!selectedActionId || isApplying || isSelectedDisabled}
        onClick={handleApply}
        className="w-full gap-2"
      >
        {isApplying ? "Aplicando..." : "Aplicar solución"}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
