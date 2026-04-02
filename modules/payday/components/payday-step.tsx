import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { ArrowRight, PartyPopper } from "lucide-react";
import { calcularNetIncome, calcularSplit } from "@/lib/quipu-calculator";

type Props = {
  currencySymbol: string;
  localIncome: number;
  onIncomeChange: (value: number) => void;
  allocationNeeds: number;
  allocationWants: number;
  allocationSavings: number;
  fixedCommitmentsTotal: number;
  onAssign: (income: number) => void;
};

export default function PaydayStep({
  currencySymbol,
  localIncome,
  onIncomeChange,
  allocationNeeds,
  allocationWants,
  allocationSavings,
  fixedCommitmentsTotal,
  onAssign,
}: Props) {
  const netIncome = calcularNetIncome(localIncome, fixedCommitmentsTotal, 0);
  const split = calcularSplit(netIncome, {
    needs: allocationNeeds,
    wants: allocationWants,
    savings: allocationSavings,
  });

  const hasIncome = localIncome > 0;

  return (
    <div className="flex flex-col items-center justify-center text-center gap-8 py-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
        <PartyPopper className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Hoy es día de pago!
        </h1>
        <p className="text-muted-foreground text-lg">
          Ingresa tu sueldo de este período para asignarlo a tus sobres.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">
            {currencySymbol}
          </span>
          <Input
            type="number"
            min={0}
            step="any"
            placeholder="0"
            className="pl-10 text-center text-lg"
            value={localIncome === 0 ? "" : localIncome}
            onChange={(e) => {
              const val = e.target.value;
              onIncomeChange(val === "" ? 0 : Number(val));
            }}
          />
        </div>
        {fixedCommitmentsTotal > 0 && hasIncome && (
          <p className="text-sm text-muted-foreground">
            Ingreso neto: {currencySymbol}{" "}
            {netIncome.toLocaleString("es", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            (descontando cuotas fijas)
          </p>
        )}
      </div>

      {hasIncome && (
        <div className="flex gap-6 text-sm">
          <span>
            🏠 {currencySymbol}{" "}
            {split.needs.toLocaleString("es", { maximumFractionDigits: 2 })}
          </span>
          <span>
            🎉 {currencySymbol}{" "}
            {split.wants.toLocaleString("es", { maximumFractionDigits: 2 })}
          </span>
          <span>
            💰 {currencySymbol}{" "}
            {split.savings.toLocaleString("es", { maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <Button
        size="lg"
        className="mt-4"
        onClick={() => onAssign(localIncome)}
        disabled={!hasIncome}
      >
        Ver asignación
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
