"use client";

import { Card, CardContent } from "@/core/components/ui/card";
import { usePreloadedQuery, Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useProfile } from "@/core/hooks/use-profile";
import { cn } from "@/lib/utils";

type Props = {
  preloaded: Preloaded<typeof api.expenses.getMonthlyTotals>;
};

export default function SummaryCard({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  const { hasJuntos } = useProfile();

  if (data === undefined || data === null) {
    return null;
  }
  return (
    <Card className="mb-6 border-0 shadow-none">
      <CardContent>
        <div
          className={cn(
            "grid gap-4 text-center",
            hasJuntos ? "grid-cols-4" : "grid-cols-3",
          )}
        >
          <div>
            <p className="text-2xl font-bold">{data.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-envelope-needs">
              {data.needs.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Necesidades</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-envelope-wants">
              {data.wants.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Gustos</p>
          </div>
          {hasJuntos && (
            <div>
              <p className="text-2xl font-bold text-envelope-juntos">
                {(data.juntos ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Juntos</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
