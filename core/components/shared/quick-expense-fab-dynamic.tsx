"use client";

import dynamic from "next/dynamic";

/**
 * Client-only wrapper: `next/dynamic` with `ssr: false` must live in a Client
 * Component (cannot be used from Server Component layouts).
 */
const QuickExpenseFAB = dynamic(
  () => import("@/core/components/shared/quick-expense-fab"),
  { ssr: false },
);

export function QuickExpenseFABDynamic() {
  return <QuickExpenseFAB />;
}
