"use client";

import { Calendar } from "lucide-react";

type Props = {
  daysRemaining: number;
  budgetUsedPercent: number;
  workerType: string;
  payFrequency?: string;
  paydays?: number[];
};

export default function MonthSummaryBar({
  daysRemaining,
  budgetUsedPercent,
  workerType,
  payFrequency,
  paydays,
}: Props) {
  const subtitle =
    workerType === "independent"
      ? `Ingresos variables · ${budgetUsedPercent}% del presupuesto usado`
      : `Pago ${payFrequency === "biweekly" ? "quincenal" : "mensual"} · día ${(paydays ?? [])[0]} · ${budgetUsedPercent}% del presupuesto usado`;

  return (
    <div className="animate-in fade-in duration-300 rounded-xl bg-muted p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
        <div>
          <p className="font-semibold text-sm">
            {daysRemaining} días restantes en el mes
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="w-full sm:w-32 shrink-0">
        <div className="w-full h-2 rounded-full bg-background overflow-hidden">
          <div
            className="h-full rounded-full bg-envelope-needs transition-all duration-700"
            style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
