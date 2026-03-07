import { cn } from "@/lib/utils";

type Props = {
  currencySymbol: string;
  amount: number;
  allocationNeeds: number;
  allocationWants: number;
  allocationSavings: number;
};

type EnvelopeCardData = {
  emoji: string;
  name: string;
  percentage: number;
  amount: number;
  borderClass: string;
  delay: string;
};

export default function AssigningStep({
  currencySymbol,
  amount,
  allocationNeeds,
  allocationWants,
  allocationSavings,
}: Props) {
  const needsAmount = amount * (allocationNeeds / 100);
  const wantsAmount = amount * (allocationWants / 100);
  const savingsAmount = amount * (allocationSavings / 100);

  const formattedAmount = amount.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const envelopes: EnvelopeCardData[] = [
    {
      emoji: "🏠",
      name: "Necesidades",
      percentage: allocationNeeds,
      amount: needsAmount,
      borderClass: "border-envelope-needs",
      delay: "",
    },
    {
      emoji: "🎉",
      name: "Gustos",
      percentage: allocationWants,
      amount: wantsAmount,
      borderClass: "border-envelope-wants",
      delay: "delay-150",
    },
    {
      emoji: "💰",
      name: "Ahorro",
      percentage: allocationSavings,
      amount: savingsAmount,
      borderClass: "border-envelope-savings",
      delay: "delay-300",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 py-16 animate-in fade-in duration-300">
      <p className="text-base text-muted-foreground">
        Asignando {currencySymbol} {formattedAmount}...
      </p>

      <div className="flex flex-col gap-4 w-full max-w-lg">
        {envelopes.map((envelope) => (
          <div
            key={envelope.name}
            className={cn(
              "flex items-center justify-between rounded-xl border-2 bg-card px-5 py-4",
              "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
              envelope.borderClass,
              envelope.delay,
            )}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl leading-none">{envelope.emoji}</span>
              <div className="flex flex-col">
                <span className="font-semibold text-base leading-snug">
                  {envelope.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {envelope.percentage}%
                </span>
              </div>
            </div>

            <span className="text-xl font-bold tabular-nums">
              {currencySymbol}{" "}
              {envelope.amount.toLocaleString("es", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
