"use client";

import { AlertTriangle, ArrowRight, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlan } from "@/hooks/use-plan";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import Link from "next/link";

type Props = {
  needsOverflow: number;
  wantsOverflow: number;
  currencySymbol: string;
};

export function RescueModeBanner({
  needsOverflow,
  wantsOverflow,
  currencySymbol,
}: Props) {
  const router = useRouter();
  const { isPremium } = usePlan();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const overflowMessage =
    needsOverflow > 0
      ? `Necesidades está ${currencySymbol} ${needsOverflow.toFixed(0)} sobre el límite`
      : `Gustos está ${currencySymbol} ${wantsOverflow.toFixed(0)} sobre el límite`;

  const handleClick = () => {
    if (isPremium) {
      router.push("/rescue");
    } else {
      setUpgradeOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className="w-full animate-in fade-in duration-300 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3 mb-6 text-left hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
        onClick={handleClick}
      >
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5">
            Modo Rescate activado
            {!isPremium ? (
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            ) : null}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            {overflowMessage}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-red-500 shrink-0" />
      </button>

      {/* Upgrade dialog for free users */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Modo Rescate es Premium
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              El Modo Rescate te permite reasignar fondos entre sobres cuando
              superas tu presupuesto. Disponible en el plan Premium.
            </p>
            <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
              {overflowMessage}
            </p>
            <Button asChild className="w-full gap-1.5">
              <Link href="/upgrade">
                <Crown className="w-3.5 h-3.5" />
                Hazte Premium
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
