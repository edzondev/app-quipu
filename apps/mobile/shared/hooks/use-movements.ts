import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import type { CycleMovementsResult } from "@/shared/lib/expenses/expense-record";
import { useProfileGate } from "./use-profile-gate";

export function useMovements():
  | { status: "loading" }
  | { status: "ready"; data: CycleMovementsResult | null } {
  const { isAuthReady } = useProfileGate();
  const data = useQuery(
    api.movements.listForActiveCycle,
    isAuthReady ? {} : "skip",
  );

  if (data === undefined) return { status: "loading" };
  return { status: "ready", data };
}
