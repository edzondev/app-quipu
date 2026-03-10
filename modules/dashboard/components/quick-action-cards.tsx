"use client";

import { Card, CardContent } from "@/core/components/ui/card";
import { MessageCircle, TrendingUp, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlan } from "@/hooks/use-plan";
import { PremiumBadge } from "@/core/components/shared/premium-badge";

type Props = {
  coachText: string;
};

export default function QuickActionCards({ coachText }: Props) {
  const router = useRouter();
  const { isFree } = usePlan();

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
      style={{ animationDelay: "500ms" }}
    >
      {/* Coach message card */}
      <Card>
        <CardContent className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-envelope-savings shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-envelope-savings mb-1">
              Coach financiero
            </p>
            <p className="text-sm leading-relaxed">{coachText}</p>
            {isFree ? (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                1 consejo por semana ·{" "}
                <span className="inline-flex items-center gap-0.5">
                  Diario con Premium <PremiumBadge />
                </span>
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Savings detail card */}
      <button
        type="button"
        className="text-left"
        onClick={() => router.push("/savings")}
      >
        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-start justify-between gap-3 h-full">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Ver detalle de ahorro</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fondos de emergencia, objetivos e inversión
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          </CardContent>
        </Card>
      </button>
    </div>
  );
}
