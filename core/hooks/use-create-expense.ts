import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useExpenseLimit } from "@/hooks/use-expense-limit";
import { type Expense, expenseSchema } from "../schemas/expense.schema";

const MAX_DECIMALS = 2;
const MAX_INTEGER_DIGITS = 8;

export default function useCreateExpense() {
  const [displayValue, setDisplayValue] = useState("0");
  const mutation = useMutation(api.expenses.registerExpense);
  const { isAtLimit, limitLabel } = useExpenseLimit();

  const form = useForm<Expense>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      envelope: "needs",
      description: "Gasto rápido",
    },
  });

  const syncFormAmount = (display: string) => {
    const parsed = parseFloat(display);
    form.setValue("amount", isNaN(parsed) ? 0 : parsed, {
      shouldValidate: true,
    });
  };

  const handleKeypad = (key: string) => {
    const prev = displayValue;
    let next = prev;

    if (key === "delete") {
      next = prev.length <= 1 ? "0" : prev.slice(0, -1);
    } else if (key === ".") {
      if (prev.includes(".")) return;
      next = prev + ".";
    } else {
      if (prev === "0") {
        next = key;
      } else {
        if (prev.includes(".")) {
          const decimals = prev.split(".")[1];
          if (decimals.length >= MAX_DECIMALS) return;
        } else {
          const integers = prev.split(".")[0];
          if (integers.length >= MAX_INTEGER_DIGITS) return;
        }
        next = prev + key;
      }
    }

    setDisplayValue(next);
    syncFormAmount(next);
  };

  const handleEnvelopeChange = (envelope: Expense["envelope"]) => {
    form.setValue("envelope", envelope);
  };

  const mutate = async (value: Expense) => {
    if (isAtLimit) return;
    try {
      await mutation(value);
      setDisplayValue("0");
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    form,
    mutate,
    handleKeypad,
    handleEnvelopeChange,
    displayValue,
    isAtLimit,
    limitLabel,
  };
}
