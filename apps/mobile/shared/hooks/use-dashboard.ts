import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import {
  type DashboardHomeInput,
  mapDashboardHome,
  mapEnvelopeRow,
} from "@/shared/lib/dashboard/home-model";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";
import { useProfileGate } from "./use-profile-gate";

export function useDashboardSummary() {
  const { isAuthReady } = useProfileGate();
  return useQuery(api.dashboard.getSummary, isAuthReady ? {} : "skip") as
    | DashboardHomeInput
    | null
    | undefined;
}

export function useHomeModel() {
  const summary = useDashboardSummary();
  if (summary === undefined) return { status: "loading" as const };
  const home = summary ? mapDashboardHome(summary, Date.now()) : null;
  if (!home) return { status: "empty" as const };
  return { status: "ready" as const, home };
}

export function useEnvelopeRows() {
  const summary = useDashboardSummary();
  if (summary === undefined) return { status: "loading" as const };
  if (!summary?.cycle) {
    return { status: "empty" as const, rows: [], currencySymbol: "S/" };
  }
  const currencySymbol =
    marketFromCurrencyCode(summary.profile.currencyCode)?.currencySymbol ??
    "S/";
  return {
    status: "ready" as const,
    rows: summary.envelopes.map(mapEnvelopeRow),
    currencySymbol,
  };
}
