"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RescueActionCardProps {
  actionId: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: (actionId: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function RescueActionCard({
  actionId,
  title,
  subtitle,
  icon,
  selected,
  onSelect,
  disabled,
  disabledReason,
}: RescueActionCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(actionId)}
      disabled={disabled}
      className={cn(
        "w-full text-left flex flex-col gap-3 rounded-xl border p-4 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-70 border-border bg-muted/30"
          : selected
            ? "cursor-pointer border-destructive bg-destructive/5 ring-2 ring-destructive/40"
            : "cursor-pointer border-border hover:border-destructive/50",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 shrink-0">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="font-semibold text-sm leading-tight">{title}</p>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          {disabledReason}
        </p>
      )}
    </button>
  );
}
