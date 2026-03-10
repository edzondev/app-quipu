import { Card, CardContent } from "@/core/components/ui/card";
import { fmt } from "@/modules/dashboard/lib/constants";
import { cn } from "@/lib/utils";

const ENVELOPE_CONFIG = {
  needs: {
    icon: "🏠",
    label: "Necesidades",
    barClass: "bg-envelope-needs",
    textClass: "text-envelope-needs",
  },
  wants: {
    icon: "🎉",
    label: "Gustos",
    barClass: "bg-envelope-wants",
    textClass: "text-envelope-wants",
  },
  savings: {
    icon: "💰",
    label: "Ahorro",
    barClass: "bg-envelope-savings",
    textClass: "text-envelope-savings",
  },
  juntos: {
    icon: "💑",
    label: "Juntos",
    barClass: "bg-envelope-juntos",
    textClass: "text-envelope-juntos",
  },
} as const;

type EnvelopeKey = keyof typeof ENVELOPE_CONFIG;

type EnvelopeData = {
  allocated?: number;
  spent?: number;
  available?: number;
  budget?: number;
  subEnvelopes?: unknown[];
  totalAccumulatedSavings?: number;
};

type Props = {
  envelopeKey: EnvelopeKey;
  data: EnvelopeData;
  allocationPct: number;
  currencySymbol: string;
  index?: number;
};

export default function EnvelopeCard({
  envelopeKey,
  data,
  allocationPct,
  currencySymbol,
  index = 0,
}: Props) {
  const config = ENVELOPE_CONFIG[envelopeKey];
  const isSavings = envelopeKey === "savings";
  const isJuntos = envelopeKey === "juntos";

  const allocated = data.allocated ?? data.budget ?? 0;
  const spent = data.spent ?? 0;
  const available = data.available ?? allocated - spent;

  const spentPct =
    allocated > 0
      ? Math.min(100, Math.round((spent / allocated) * 100))
      : spent > 0
        ? 100
        : 0;

  const displayAmount = isSavings
    ? data.totalAccumulatedSavings != null && data.totalAccumulatedSavings > 0
      ? data.totalAccumulatedSavings
      : allocated
    : available;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
      style={{ animationDelay: `${index * 100 + 200}ms` }}
    >
      <Card className="overflow-hidden h-full">
        <CardContent className="space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{config.icon}</span>
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isJuntos
                    ? "Presupuesto compartido"
                    : `${allocationPct}% del ingreso`}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "font-bold text-lg leading-tight shrink-0",
                config.textClass,
              )}
            >
              {fmt(displayAmount, currencySymbol)}
            </span>
          </div>

          {/* Progress bar */}
          {!isSavings && (
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  config.barClass,
                )}
                style={{ width: `${spentPct}%` }}
              />
            </div>
          )}

          {/* Bottom info */}
          {isSavings ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Total acumulado en tus fondos de ahorro
            </p>
          ) : (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Gastado: {fmt(spent, currencySymbol)}</span>
              <span>Presupuesto: {fmt(allocated, currencySymbol)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
