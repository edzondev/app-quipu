import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import SummaryCard from "@/modules/expenses/components/summary-card";
import ListCard from "@/modules/expenses/components/list-card";

export default async function ExpensesPage() {
  const [getMonthlyTotals] = await Promise.all([
    preloadAuthQuery(api.expenses.getMonthlyTotals, {}),
  ]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground mt-1">
            Historial completo de tus transacciones
          </p>
        </div>
        {/*
              <Button onClick={() => navigate("/add-expense")} className="gap-2 w-fit">
                <Plus className="w-4 h-4" /> Registrar gasto
              </Button>
          */}
      </div>

      {/* Summary */}
      <div className="animate-in fade-in duration-300">
        <SummaryCard preloaded={getMonthlyTotals} />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <ListCard />
      </div>
    </>
  );
}
