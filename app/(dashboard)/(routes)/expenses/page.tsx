import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import { getServerCalendarStrings } from "@/lib/server-calendar";
import SummaryCard from "@/modules/expenses/components/summary-card";
import ExpensesClient from "@/modules/expenses/components/expenses-client";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Gastos",
  description:
    "Historial completo de tus transacciones y resumen de gastos por sobre.",
};

async function ExpensesContent() {
  const { month } = await getServerCalendarStrings();
  const preloadedTotals = await preloadAuthQuery(api.expenses.getMonthlyTotals, {
    month,
  });

  return (
    <>
      <div className="animate-in fade-in duration-300">
        <SummaryCard preloaded={preloadedTotals} />
      </div>
      <ExpensesClient />
    </>
  );
}

export default function ExpensesPage() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground mt-1">
            Historial completo de tus transacciones
          </p>
        </div>
      </div>
      <Suspense fallback={null}>
        <ExpensesContent />
      </Suspense>
    </>
  );
}
