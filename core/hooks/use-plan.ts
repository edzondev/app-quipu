"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Central hook for reading the current user's subscription plan.
 *
 * Uses `api.subscriptions.getMyPlan` as the single source of truth —
 * the same query that the backend enforces via `requirePremium`.
 *
 * @example
 * const { isPremium, isLoading } = usePlan();
 * if (isPremium) { ... }
 */
export function usePlan() {
  const data = useQuery(api.subscriptions.getMyPlan);

  const isLoading = data === undefined;
  const plan = data?.plan ?? null;

  return {
    /** True while the query hasn't resolved yet. */
    isLoading,
    /** The raw plan value: "free" | "premium" | null (loading). */
    plan,
    /** True only when confirmed premium. False while loading or free. */
    isPremium: plan === "premium",
    /** True only when confirmed free. False while loading or premium. */
    isFree: plan === "free",
  };
}
