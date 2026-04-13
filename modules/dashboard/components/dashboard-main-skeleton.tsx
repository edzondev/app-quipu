import { Card, CardContent } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { cn } from "@/lib/utils";

const pulseStagger = (i: number) => ({
  animationDelay: `${i * 70}ms`,
});

/**
 * Placeholder que respeta la jerarquía del dashboard real (header, resumen del mes,
 * sobres, coach y gastos recientes) para evitar saltos de layout bruscos.
 */
export function DashboardMainSkeleton() {
  return (
    <output
      className="block w-full space-y-8"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando panel principal</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-9 w-52 max-w-full rounded-md sm:h-10 sm:w-64" />
        </div>
        <Skeleton className="h-10 w-44 shrink-0 rounded-lg" />
      </div>

      <Skeleton className="h-12 w-full max-w-md rounded-xl" />

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/35 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-52 max-w-full rounded-md" />
            <Skeleton className="h-3 w-64 max-w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-2 w-full shrink-0 rounded-full sm:w-36" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((key, i) => (
          <Card
            key={key}
            className="overflow-hidden border-border/70 shadow-sm"
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <Skeleton
                  className="h-8 w-8 rounded-lg"
                  style={pulseStagger(i)}
                />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
              <Skeleton className="h-8 w-[55%] rounded-md" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between gap-2 pt-0.5">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-[4.5rem] w-full max-w-2xl rounded-xl" />

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-[92%] rounded-md" />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-5 w-44 rounded-md" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-14 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-14 rounded-full" />
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {["r1", "r2", "r3", "r4"].map((key, i) => (
              <div
                key={key}
                className={cn(
                  "flex justify-between gap-4 py-3 first:pt-0",
                  "last:pb-0",
                )}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton
                    className="h-4 w-[72%] rounded-md"
                    style={pulseStagger(i)}
                  />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Skeleton className="hidden h-6 w-[4.5rem] rounded-full sm:block" />
                  <Skeleton className="h-4 w-14 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </output>
  );
}
