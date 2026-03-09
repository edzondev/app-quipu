"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";

type Props = {
  currencySymbol: string;
  onSubmit: (amount: number) => void;
};

export default function IncomeInputStep({ currencySymbol, onSubmit }: Props) {
  const [amount, setAmount] = useState<number>(0);

  return (
    <div className="flex flex-col items-center gap-8 py-16 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          ¿Cuánto cobraste hoy?
        </h1>
      </div>

      <div className="relative w-full max-w-xs">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg pointer-events-none">
          {currencySymbol}
        </span>
        <Input
          type="number"
          min={0}
          step={100}
          placeholder="0"
          className="pl-12 text-center text-3xl font-bold h-16"
          value={amount === 0 ? "" : amount}
          onChange={(e) => {
            const val = e.target.value;
            setAmount(val === "" ? 0 : Number(val));
          }}
        />
      </div>

      <Button size="lg" disabled={amount <= 0} onClick={() => onSubmit(amount)}>
        Asignar <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}
