import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import {
  BADGE_CLASS,
  ENVELOPE_LABEL,
  fmt,
} from "@/modules/dashboard/lib/constants";
import type { ExpenseFilter } from "@/modules/dashboard/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { ArrowRight, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

type Expense = {
  _id: string;
  description?: string | null;
  date: string;
  amount: number;
  envelope: string;
};

type Props = {
  recentExpenses: Expense[];
  filteredExpenses: Expense[];
  filter: ExpenseFilter;
  onFilterChange: (filter: ExpenseFilter) => void;
  currencySymbol: string;
};

const FILTER_LABELS: Record<ExpenseFilter, string> = {
  all: "Todos",
  needs: "Necesidades",
  wants: "Gustos",
};

export default function RecentExpenses({
  recentExpenses,
  filteredExpenses,
  filter,
  onFilterChange,
  currencySymbol,
}: Props) {
  const router = useRouter();

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
      style={{ animationDelay: "600ms" }}
    >
      <Card>
        <CardContent className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold">Gastos recientes</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "needs", "wants"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFilterChange(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    filter === f
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 h-auto py-1"
                onClick={() => router.push("/expenses")}
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Empty state */}
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {recentExpenses.length === 0
                  ? "Aún no has registrado gastos. ¡Empieza registrando tu primer gasto!"
                  : "No hay gastos en esta categoría."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {expense.description ?? "Gasto"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant="secondary"
                      className={BADGE_CLASS[expense.envelope] ?? ""}
                    >
                      {ENVELOPE_LABEL[expense.envelope] ?? expense.envelope}
                    </Badge>
                    <span className="text-sm font-semibold">
                      -{fmt(expense.amount, currencySymbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
