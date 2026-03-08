"use client";

import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

// ─── Static constants (module-level — computed once, never re-created) ─────────

export const GOAL_EMOJIS = [
  "💻", "✈️", "🏠", "🚗", "💍", "🎮", "📸", "🎸",
  "👗", "🎓", "🏄", "💎", "🏋️", "🐶", "📱", "🌴",
  "🎯", "🚲", "🏖️", "🎪", "🛒", "🏥", "🚀", "🎁",
];

export const MONTH_OPTIONS = generateMonthOptions();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateMonthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i <= 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = `${year}-${String(month).padStart(2, "0")}`;
    const raw = date.toLocaleDateString("es-PE", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
  }
  return options;
}

/** "YYYY-MM" → last calendar day of that month as "YYYY-MM-DD" */
function toLastDayOfMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** Full months between now and the selected month (min 1). Returns 0 if empty. */
function monthsUntilDeadline(yyyymm: string): number {
  if (!yyyymm) return 0;
  const [year, month] = yyyymm.split("-").map(Number);
  const now = new Date();
  const diff = (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth());
  return Math.max(1, diff);
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  emoji: z.string().min(1, "Selecciona un ícono"),
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  targetAmount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  deadlineMonth: z.string().min(1, "Selecciona una fecha límite"),
});

export type NewGoalFormData = z.infer<typeof schema>;

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useNewGoal() {
  const createGoal = useMutation(api.savings.createSavingsGoal);

  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<NewGoalFormData>({
    resolver: zodResolver(schema),
    defaultValues: { emoji: "", name: "", targetAmount: 0, deadlineMonth: "" },
  });

  // Watched values for the live estimate — no useMemo needed, simple derivation
  const targetAmount = useWatch({ control: form.control, name: "targetAmount" });
  const deadlineMonth = useWatch({ control: form.control, name: "deadlineMonth" });

  const monthsUntil = monthsUntilDeadline(deadlineMonth);
  // null when inputs are not yet filled — prevents NaN in the UI
  const monthlyEstimate =
    targetAmount > 0 && monthsUntil > 0
      ? Math.ceil(targetAmount / monthsUntil)
      : null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      form.reset();
      setSubmitError(null);
    }
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await createGoal({
        emoji: data.emoji,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: toLastDayOfMonth(data.deadlineMonth),
        monthlyRequired: Math.ceil(data.targetAmount / monthsUntilDeadline(data.deadlineMonth)),
      });
      handleOpenChange(false);
    } catch (err) {
      if (err instanceof ConvexError) setSubmitError(String(err.data));
      else setSubmitError("Ocurrió un error. Inténtalo de nuevo.");
    }
  });

  return {
    form,
    open,
    handleOpenChange,
    submitError,
    isSubmitting: form.formState.isSubmitting,
    monthlyEstimate,
    monthsUntil,
    onSubmit,
  };
}
