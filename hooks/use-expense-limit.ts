"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { usePlan } from "@/hooks/use-plan";

const FREE_PLAN_MONTHLY_LIMIT = 20;

/**
 * Returns the current month's expense count and whether the free plan
 * limit has been reached.
 *
 * @example
 * const { count, isAtLimit, limitLabel, isLoading } = useExpenseLimit();
 * if (isAtLimit) // show upgrade prompt
 */
export function useExpenseLimit() {
  const { isFree, isLoading: isPlanLoading } = usePlan();
  const count = useQuery(api.expenses.getCurrentMonthCount);

  const isLoading = isPlanLoading || count === undefined;
  const currentCount = count ?? 0;

  // Free users are capped; premium users never hit the limit
  const isAtLimit = isFree && currentCount >= FREE_PLAN_MONTHLY_LIMIT;

  // e.g. "17 / 20" — only meaningful for free users
  const limitLabel = isFree
    ? `${currentCount} / ${FREE_PLAN_MONTHLY_LIMIT}`
    : null;

  return {
    /** True while either the plan or the count query is loading. */
    isLoading,
    /** Number of expenses registered this month. */
    count: currentCount,
    /** True when the user is on the free plan and has hit the 20/month cap. */
    isAtLimit,
    /**
     * "X / 20" string for free users, null for premium.
     * Use this to render the counter badge in the expense form.
     */
    limitLabel,
    /** The hard cap value (20). Exposed so UI never hardcodes the number. */
    limit: FREE_PLAN_MONTHLY_LIMIT,
  };
}
