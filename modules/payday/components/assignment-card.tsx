"use client";

import { CalendarDays, CircleCheck } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";

const FREQUENCY_LABEL: Record<"monthly" | "biweekly", string> = {
  monthly: "pago mensual",
  biweekly: "pago quincenal",
};

type Props = {
  currencySymbol: string;
  totalAssignable: number;
  isPayday: boolean;
  hasProcessedCurrentPayday: boolean;
  nextPaydayDate: string;
  daysUntilNextPayday: number;
  payFrequency: "monthly" | "biweekly";
  onAssign: () => void;
  isAssigning: boolean;
};

export function AssignmentCard({
  currencySymbol,
  totalAssignable,
  isPayday,
  hasProcessedCurrentPayday,
  nextPaydayDate,
  daysUntilNextPayday,
  payFrequency,
  onAssign,
  isAssigning,
}: Props) {
  const [year, month, day] = nextPaydayDate.split("-").map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
  });

  const formattedTotal = totalAssignable.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const canAssign = isPayday && !hasProcessedCurrentPayday;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {hasProcessedCurrentPayday
            ? "Asignación completada"
            : "Próxima asignación"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        {hasProcessedCurrentPayday ? (
          <div className="flex flex-col items-center justify-center gap-3 flex-1 text-center py-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-envelope-savings/15">
              <CircleCheck className="w-6 h-6 text-envelope-savings" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Ya asignaste tu ingreso este período
              </p>
              <p className="text-xs text-muted-foreground">
                Tu dinero ya fue distribuido a tus sobres.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{dateLabel}</p>
              <p className="text-sm text-muted-foreground">
                {!isPayday &&
                  (daysUntilNextPayday === 1
                    ? "Falta 1 día · "
                    : `Faltan ${daysUntilNextPayday} días · `)}
                Tu dinero se asignará automáticamente según tu plan 50/30/20.
              </p>
              {!isPayday && (
                <p className="text-xs text-muted-foreground">
                  Tienes configurado un {FREQUENCY_LABEL[payFrequency]}.
                </p>
              )}
            </div>
            <Button
              size="lg"
              className="w-full mt-auto"
              onClick={onAssign}
              disabled={!canAssign || isAssigning}
            >
              Asignar {currencySymbol} {formattedTotal}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
