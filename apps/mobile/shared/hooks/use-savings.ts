import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import {
  mapSavingsOverview,
  type SavingsModel,
  type SavingsOverviewInput,
} from "@/shared/lib/savings/model";
import { useProfileGate } from "./use-profile-gate";

export function useSavingsOverview() {
  const { isAuthReady } = useProfileGate();
  const data = useQuery(api.savings.getOverview, isAuthReady ? {} : "skip") as
    | SavingsOverviewInput
    | null
    | undefined;

  return useMemo(() => {
    if (data === undefined) return { status: "loading" as const };
    const model: SavingsModel | null = mapSavingsOverview(data);
    if (!model) return { status: "empty" as const };
    return { status: "ready" as const, model };
  }, [data]);
}
