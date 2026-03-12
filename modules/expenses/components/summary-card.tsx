"use client";

import { Card, CardContent } from "@/core/components/ui/card";
import { usePreloadedQuery, Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useProfile } from "@/core/hooks/use-profile";
import { cn } from "@/lib/utils";
import { fmt } from "@/modules/dashboard/lib/constants";

type Props = {
  preloaded: Preloaded<typeof api.expenses.getMonthlyTotals>;
};

export default function SummaryCard({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  const { hasJuntos, profile } = useProfile();
  const currencySymbol = profile?.currencySymbol ?? "S/";

  const isLoading = data === undefined;

  if (isLoading) {
    return null;
  }
  return (
    <Card className="mb-6">
      <CardContent>
        <div
          className={cn(
            "grid gap-4 text-center",
            hasJuntos ? "grid-cols-4" : "grid-cols-3",
          )}
        >
          <div>
            <p className="text-2xl font-bold">{fmt(data.total, currencySymbol)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-envelope-needs">
              {fmt(data.needs, currencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">Necesidades</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-envelope-wants">
              {fmt(data.wants, currencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">Gustos</p>
          </div>
          {hasJuntos && (
            <div>
              <p className="text-2xl font-bold text-envelope-juntos">
                {fmt(data.juntos ?? 0, currencySymbol)}
              </p>
              <p className="text-xs text-muted-foreground">Juntos</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
