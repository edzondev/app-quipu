"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useProfile } from "@/core/hooks/use-profile";
import { cn } from "@/lib/utils";

type Props = {
  preloaded: Preloaded<typeof api.expenses.getMonthlyTotals>;
};

const SUMMARY_SKELETON_KEYS_THREE = ["total", "needs", "wants"] as const;
const SUMMARY_SKELETON_KEYS_FOUR = [
  "total",
  "needs",
  "wants",
  "juntos",
] as const;

export default function SummaryCard({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  const { hasJuntos } = useProfile();

  const loading = data === undefined || data === null;

  if (loading) {
    const keys = hasJuntos
      ? SUMMARY_SKELETON_KEYS_FOUR
      : SUMMARY_SKELETON_KEYS_THREE;
    return (
      <Card className="mb-6 border-0 shadow-none">
        <CardContent className="pt-6">
          <output
            className={cn(
              "block grid gap-6 text-center",
              hasJuntos ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
            )}
            aria-live="polite"
            aria-busy="true"
          >
            <span className="sr-only">Cargando totales del mes</span>
            {keys.map((key, i) => (
              <div key={key} className="flex flex-col items-center gap-2">
                <Skeleton
                  className="h-8 w-24 rounded-md"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </output>
        </CardContent>
      </Card>
    );
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
