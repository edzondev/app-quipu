"use client";

import { Info } from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";

export function ExpensesUpdateBanner() {
  const [isMounted, setIsMounted] = useState(false);
  const show = useFeatureFlagEnabled("show-edit-delete-expenses-alert");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !show) return null;

  return (
    <Alert
      variant="default"
      className="mb-4 rounded-xl border-transparent bg-white dark:bg-zinc-900 px-3 py-3 shadow-sm"
    >
      <Info className="mt-0.5 size-6" color="#ffffff" fill="#8200db" />
      <AlertTitle className="text-sm font-medium tracking-tight text-purple-700">
        Nuevo: edición y eliminación de gastos
      </AlertTitle>
      <AlertDescription className="mt-1 text-[13px] leading-relaxed text-gray-500">
        Presiona cualquier gasto de la lista para editarlo o eliminarlo en pocos
        segundos.
      </AlertDescription>
    </Alert>
  );
}
