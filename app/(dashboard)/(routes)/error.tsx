"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/core/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-xl font-bold">Ocurrió un error</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        No pudimos cargar esta sección. Por favor intenta de nuevo.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Ir al inicio</Link>
        </Button>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
