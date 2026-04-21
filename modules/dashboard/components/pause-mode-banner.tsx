"use client";

import { ArrowRight, Pause } from "lucide-react";
import Link from "next/link";

type Props = {
  remaining: number;
  currencySymbol: string;
};

function formatAmount(value: number): string {
  return value.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function PauseModeBanner({ remaining, currencySymbol }: Props) {
  return (
    <Link
      href="/payday"
      className="w-full animate-in fade-in duration-300 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 flex items-center gap-3 mb-6 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
    >
      <div className="flex items-center justify-center size-10 rounded-full bg-amber-100 dark:bg-amber-900/90 text-amber-700 dark:text-amber-300 shrink-0">
        <Pause className="size-5 fill-current" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
          Modo Pausa activo
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-300 tabular-nums">
          Fondo restante: {currencySymbol} {formatAmount(remaining)}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm text-amber-800 dark:text-amber-300 shrink-0">
        Gestionar
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}
