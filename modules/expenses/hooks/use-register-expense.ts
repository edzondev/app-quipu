"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import { useEnvelopes } from "@/core/hooks/use-envelopes";
import { useExpenseLimit } from "@/hooks/use-expense-limit";
import {
  type RegisterExpense,
  registerExpenseSchema,
} from "../schemas/register-expense.schema";

export function useRegisterExpense() {
  const router = useRouter();
  const profile = useQuery(api.profiles.getMyProfile);
  const { envelopes } = useEnvelopes();
  const registerExpense = useMutation(api.expenses.registerExpense);
  const {
    isAtLimit,
    limitLabel,
    isLoading: isLimitLoading,
  } = useExpenseLimit();

  const form = useForm<RegisterExpense>({
    resolver: zodResolver(registerExpenseSchema),
    mode: "onTouched",
    defaultValues: {
      registeredBy: "user",
      amount: 0,
      description: "",
      envelope: "wants",
    },
  });

  const mutate = async (data: RegisterExpense) => {
    if (isAtLimit) return;
    try {
      await registerExpense({
        amount: data.amount,
        envelope: data.envelope,
        description: data.description,
        registeredBy: data.registeredBy,
      });
      router.push("/expenses");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Error al registrar el gasto";
      form.setError("root", { message });
    }
  };

  return {
    form,
    mutate,
    profile,
    envelopes,
    isAtLimit,
    limitLabel,
    isLimitLoading,
  };
}
