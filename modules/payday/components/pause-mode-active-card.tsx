"use client";

import { Pause } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Separator } from "@/core/components/ui/separator";
import { usePauseMode } from "../hooks/use-pause-mode";

type Props = {
  currencySymbol: string;
  fund: number;
  spent: number;
  remaining: number;
  startedAt: string; // "YYYY-MM-DD"
};

function fundStatusMessage(spent: number, fund: number): string {
  const pct = fund > 0 ? (spent / fund) * 100 : 0;
  if (pct < 10) return "Tu fondo está prácticamente intacto.";
  if (pct < 50) return `Has consumido ${Math.round(pct)}% de tu fondo.`;
  if (pct < 85) return "Tu fondo se está reduciendo, planifica con cuidado.";
  return "Tu fondo está por agotarse.";
}

function formatStartedAt(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
  });
}

function formatAmount(value: number): string {
  return value.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function PauseModeActiveCard({
  currencySymbol,
  fund,
  spent,
  remaining,
  startedAt,
}: Props) {
  const { deactivate, isDeactivating } = usePauseMode();

  const startedAtLabel = formatStartedAt(startedAt);
  const statusMessage = fundStatusMessage(spent, fund);

  const handleDeactivate = async () => {
    try {
      await deactivate();
    } catch {
      // Toast already shown by the hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-amber-100 text-amber-700 shrink-0">
              <Pause className="size-5 fill-current" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold">
                Modo Pausa activo
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Desde {startedAtLabel}
              </p>
            </div>
          </div>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Pausa
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fondo inicial</span>
          <span className="font-medium tabular-nums">
            {currencySymbol} {formatAmount(fund)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Gastos</span>
          <span className="font-medium tabular-nums text-red-600">
            -{currencySymbol} {formatAmount(spent)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Fondo restante</span>
          <span className="text-base font-bold tabular-nums">
            {currencySymbol} {formatAmount(remaining)}
          </span>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-xs text-amber-800">{statusMessage}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleDeactivate}
          disabled={isDeactivating}
        >
          {isDeactivating ? "Desactivando..." : "Desactivar Modo Pausa"}
        </Button>
      </CardContent>
    </Card>
  );
}
