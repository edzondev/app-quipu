import { CalendarDays } from "lucide-react";

type Props = {
  nextPaydayDate: string;
  daysUntilNextPayday: number;
  payFrequency: "monthly" | "biweekly";
};

const FREQUENCY_LABEL: Record<"monthly" | "biweekly", string> = {
  monthly: "pago mensual",
  biweekly: "pago quincenal",
};

export default function NextPaydayView({
  nextPaydayDate,
  daysUntilNextPayday,
  payFrequency,
}: Props) {
  const [year, month, day] = nextPaydayDate.split("-").map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
        <CalendarDays className="w-10 h-10 text-muted-foreground" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">
          Tu próximo pago es el {dateLabel}
        </h1>
        <p className="text-muted-foreground text-lg">
          {daysUntilNextPayday === 1
            ? "Falta 1 día"
            : `Faltan ${daysUntilNextPayday} días`}
        </p>
        <p className="text-sm text-muted-foreground pt-2">
          Tienes configurado un {FREQUENCY_LABEL[payFrequency]}. Vuelve aquí el
          día de pago para asignar tu ingreso a cada sobre.
        </p>
      </div>
    </div>
  );
}
