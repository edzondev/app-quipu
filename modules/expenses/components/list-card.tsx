"use client";

import { Card, CardContent } from "@/core/components/ui/card";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Receipt } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { useProfile } from "@/core/hooks/use-profile";

type Envelope = "needs" | "wants" | "juntos";

type Props = {
  envelope?: Envelope;
  month?: string; // "YYYY-MM"
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

export default function ListCard({ envelope, month }: Props) {
  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.expenses.listExpenses,
    { envelope, month },
    { initialNumItems: 20 },
  );
  const { profile } = useProfile();

  return (
    <Card>
      <CardContent>
        {!isLoading && results && results.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No se encontraron gastos.
            </p>
          </div>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="divide-y divide-border">
            {results.map((expense) => (
              <div
                key={expense._id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
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
                    - S/ {expense.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && <Loader2 className="w-8 h-8 animate-spin mx-auto" />}

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
    </Card>
  );
}
