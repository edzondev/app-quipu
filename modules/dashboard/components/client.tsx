"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Header from "./header";
import { AlertTriangle, ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/core/components/ui/card";
import { cn } from "@/lib/utils";
import EnvelopeCard from "./envelope-card";
import { formatCurrency } from "@/lib/format-currency";

type Props = {
  preloaded: Preloaded<typeof api.payday.getDashboardData>;
};

export default function Client({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  return (
    <>
      <Header name={data?.profile?.name} month={data?.month} />

      {/* Month summary bar */}
      <div className="animate-in fade-in duration-300 rounded-xl bg-muted p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">28 días restantes en el mes</p>
            <p className="text-sm text-muted-foreground">
              Pago{" "}
              {data?.profile.payFrequency === "biweekly"
                ? "quincenal"
                : "mensual"}{" "}
              · dia 1 · 128% del presupuesto usado
            </p>
          </div>
        </div>
        <div className="w-full sm:w-32">
          <div className="w-full h-2.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-envelope-needs transition-all duration-700 ease-out"
              //style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Envelopes grid */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 mb-6",
          data?.isCoupleModeEnabled
            ? "md:grid-cols-2 xl:grid-cols-4"
            : "lg:grid-cols-3",
        )}
      >
        {data?.envelopes &&
          Object.values(data.envelopes).map((envelope, i) => (
            <div key={Object.keys(data.envelopes)[i]}>
              <EnvelopeCard
                envelope={Object.values(data.envelopes)}
                index={i}
              />
              {data.commitmentsForEnvelope > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                  📋 Incluye {data.commitmentsForEnvelope} en cuotas fijas
                </p>
              )}
            </div>
          ))}
      </div>
    </>
  );
}
