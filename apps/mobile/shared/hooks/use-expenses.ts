import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import {
  type RecentExpense,
  readRecentExpenses,
} from "@/shared/lib/movements/model";
import { useProfileGate } from "./use-profile-gate";

export function useRecentExpenses() {
  const { isAuthReady } = useProfileGate();
  const data = useQuery(
    api.expenses.getRecentExpenses,
    isAuthReady ? {} : "skip",
  );

  return useMemo(() => {
    if (data === undefined) {
      return { status: "loading" as const, expenses: [] as RecentExpense[] };
    }
    return { status: "ready" as const, expenses: readRecentExpenses(data) };
  }, [data]);
}
