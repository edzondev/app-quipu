import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";

const stagger = (i: number) => ({ animationDelay: `${i * 45}ms` });

export default function SettingsLoading() {
  return (
    <output
      className="block max-w-2xl space-y-6"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando configuración</span>

      <div className="space-y-2">
        <Skeleton
          className="h-9 w-64 max-w-full rounded-md"
          style={stagger(0)}
        />
        <Skeleton
          className="h-4 w-80 max-w-full rounded-md"
          style={stagger(1)}
        />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-0 pb-4">
            <Skeleton className="h-6 w-44 max-w-full rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-56 max-w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md pl-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 max-w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-3 w-full max-w-sm rounded-md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-4">
            <Skeleton className="h-6 w-56 max-w-full rounded-md" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {["needs", "wants", "savings"].map((key, i) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <Skeleton
                      className="h-4 w-24 max-w-full rounded-md"
                      style={stagger(2 + i)}
                    />
                    <Skeleton className="h-4 w-9 shrink-0 rounded-md" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-10 rounded-md" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-44 max-w-full rounded-md" />
              <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-4">
            <Skeleton className="h-6 w-64 max-w-full rounded-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
            <div className="divide-y rounded-md border border-border/50">
              {[0, 1].map((i) => (
                <div
                  key={`commitment-row-${i}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-36 max-w-full rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                </div>
              ))}
            </div>
            <div className="h-px w-full bg-border" aria-hidden />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>

        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="space-y-3 rounded-xl border border-border/70 p-4">
          <Skeleton className="h-5 w-48 max-w-full rounded-md" />
          <Skeleton className="h-4 w-full max-w-lg rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </output>
  );
}
