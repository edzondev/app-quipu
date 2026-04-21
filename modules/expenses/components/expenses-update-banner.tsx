"use client";

import { useFeatureFlagEnabled } from "posthog-js/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { Info } from "lucide-react";

export function ExpensesUpdateBanner() {
  const show = useFeatureFlagEnabled("show-edit-delete-expenses-alert");

  if (!show) return null;

  return (
    <Alert variant="info" className="mb-4">
      <Info className="mt-0.5 size-4 text-sky-600" />
      <AlertTitle className="text-sm font-semibold tracking-tight text-sky-950">
        ¡Ya puedes editar y eliminar gastos!
      </AlertTitle>
      <AlertDescription>
        Preisona cualquier gasto de la lista para editarlo o eliminarlo.
      </AlertDescription>
    </Alert>
  );
}
