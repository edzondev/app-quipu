import { Button } from "@/core/components/ui/button";
import { ArrowRight, PartyPopper } from "lucide-react";

type Props = {
  currencySymbol: string;
  monthlyIncome: number;
  onAssign: () => void;
};

export default function PaydayStep({
  currencySymbol,
  monthlyIncome,
  onAssign,
}: Props) {
  const formattedIncome = monthlyIncome.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div className="flex flex-col items-center justify-center text-center gap-8 py-20 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
        <PartyPopper className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Hoy es día de pago!
        </h1>
        <p className="text-muted-foreground text-lg">
          Tu ingreso de{" "}
          <span className="font-semibold text-foreground">
            {currencySymbol} {formattedIncome}
          </span>{" "}
          será asignado automáticamente según tu plan.
        </p>
      </div>

      <Button size="lg" className="mt-4" onClick={onAssign}>
        Ver asignación
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
