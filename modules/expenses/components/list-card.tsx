"use client";

import { usePaginatedQuery } from "convex/react";
import { Receipt } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/core/components/ui/badge";
import { Card, CardContent } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useProfile } from "@/core/hooks/use-profile";
import { cn } from "@/lib/utils";

// Modal: loaded on demand when user selects an expense to edit
const EditExpenseModal = dynamic(
  () => import("./edit-expense-modal").then((m) => m.EditExpenseModal),
  { ssr: false },
);

type Envelope = "needs" | "wants" | "juntos";

type ExpenseItem = {
  _id: Id<"expenses">;
  amount: number;
  description?: string;
  envelope: Envelope;
  date: string;
  registeredBy?: "user" | "partner";
};

type Props = {
  envelope?: Envelope;
  month?: string; // "YYYY-MM"
  className?: string;
};

const getBadgeClass = (envelope: string) => {
  if (envelope === "needs")
    return "bg-envelope-needs/15 text-envelope-needs border-0";
  if (envelope === "wants")
    return "bg-envelope-wants/15 text-envelope-wants border-0";
  if (envelope === "juntos")
    return "bg-envelope-juntos/15 text-envelope-juntos border-0";
  return "";
};

const getEnvelopeLabel = (envelope: string) => {
  if (envelope === "needs") return "Necesidades";
  if (envelope === "wants") return "Gustos";
  if (envelope === "juntos") return "Juntos";
  return envelope;
};

const EXPENSE_LIST_SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export default function ListCard({ envelope, month, className }: Props) {
  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.expenses.listExpenses,
    { envelope, month },
    { initialNumItems: 20 },
  );
  const { profile } = useProfile();
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(
    null,
  );

  const hasResults = results && results.length > 0;
  const isEmpty = !isLoading && results && results.length === 0;

  return (
    <Card className={cn("py-3", className)}>
      <CardContent className="relative">
        {isLoading && !hasResults ? (
          <output
            className="block min-h-41 space-y-0 divide-y divide-border px-1"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="sr-only">Cargando gastos</span>
            {EXPENSE_LIST_SKELETON_KEYS.map((key, i) => (
              <div
                key={key}
                className="flex w-full items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton
                    className="h-4 w-[min(100%,14rem)] rounded-md"
                    style={{ animationDelay: `${i * 55}ms` }}
                  />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Skeleton className="hidden h-6 w-[5.5rem] rounded-full sm:block" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </output>
        ) : null}

        {isEmpty && (
          <div className="text-center py-12 space-y-2">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No se encontraron gastos.
            </p>
          </div>
        )}

        {hasResults && (
          <div className="divide-y divide-border">
            {results.map((expense) => (
              <button
                type="button"
                key={expense._id}
                onClick={() => setSelectedExpense(expense as ExpenseItem)}
                className="flex w-full items-center justify-between py-3 text-left cursor-pointer hover:bg-muted/50 mx-auto px-2 rounded-lg transition-colors border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {expense.description}
                    {expense.envelope === "juntos" && expense.registeredBy && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ·{" "}
                        {expense.registeredBy === "partner"
                          ? profile?.couplePartnerName[0]?.toUpperCase()
                          : profile?.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {expense.date}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant="secondary"
                    className={getBadgeClass(expense.envelope)}
                  >
                    {getEnvelopeLabel(expense.envelope)}
                  </Badge>
                  <span className="text-sm font-semibold">
                    - {profile?.currencySymbol ?? "S/"}{" "}
                    {expense.amount.toFixed(2)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {status === "CanLoadMore" && (
          <button
            type="button"
            onClick={() => loadMore(20)}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={status !== "CanLoadMore"}
          >
            Cargar más
          </button>
        )}
      </CardContent>

      <EditExpenseModal
        expense={selectedExpense}
        open={selectedExpense !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedExpense(null);
        }}
      />
    </Card>
  );
}
