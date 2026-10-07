import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import {
  type MovementRow,
  type MovementSource,
  mapMovementRows,
} from "@/shared/lib/movements/model";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";
import { useProfileGate } from "./use-profile-gate";

type MovementsQuery = {
  currencyCode?: string;
  movements?: MovementSource[];
} | null;

export function useMovements() {
  const { isAuthReady } = useProfileGate();
  const data = useQuery(
    api.movements.listForActiveCycle,
    isAuthReady ? {} : "skip",
  ) as MovementsQuery | undefined;

  if (data === undefined) {
    return {
      status: "loading" as const,
      rows: [] as MovementRow[],
      currencySymbol: "S/",
    };
  }
  if (!data?.movements) {
    return {
      status: "empty" as const,
      rows: [] as MovementRow[],
      currencySymbol: "S/",
    };
  }
  return {
    status: "ready" as const,
    rows: mapMovementRows(data.movements),
    currencySymbol:
      marketFromCurrencyCode(data.currencyCode ?? "")?.currencySymbol ?? "S/",
  };
}
