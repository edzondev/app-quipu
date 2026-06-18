export function GlobalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-2xl">🧵</span>
          <span className="absolute inset-0 animate-pulse rounded-2xl bg-primary/5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Cargando Quipu…
        </p>
      </div>
    </div>
  );
}
