"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  type UpdateExpense,
  updateExpenseSchema,
} from "../schemas/update-expense.schema";

type UseUpdateExpenseOptions = {
  expenseId: Id<"expenses">;
  defaultValues: UpdateExpense;
  onSuccess: () => void;
};

export function useUpdateExpense({
  expenseId,
  defaultValues,
  onSuccess,
}: UseUpdateExpenseOptions) {
  const updateExpense = useMutation(api.expenses.updateExpense);

  const form = useForm<UpdateExpense>({
    resolver: zodResolver(updateExpenseSchema),
    mode: "onTouched",
    defaultValues,
  });

  const mutate = async (data: UpdateExpense) => {
    try {
      await updateExpense({
        expenseId,
        amount: data.amount,
        envelope: data.envelope,
        description: data.description,
      });
      onSuccess();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error al actualizar el gasto";
      form.setError("root", { message });
    }
  };

  return { form, mutate };
}
