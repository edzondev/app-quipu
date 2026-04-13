import { RegisterExpenseForm } from "@/modules/expenses/components/register-expense-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrar gasto",
  description: "Añade un nuevo gasto a uno de tus sobres de presupuesto.",
};

export default function AddExpensePage() {
  return (
    <div className="max-w-lg mx-auto">
      <RegisterExpenseForm />
    </div>
  );
}
