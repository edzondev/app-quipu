"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Button } from "@/core/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { Switch } from "@/core/components/ui/switch";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  amount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  includeInBudget: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onDone: () => void;
};

export function AddExtraIncomeForm({ onDone }: Props) {
  const addExtraIncome = useMutation(api.extraIncomes.addExtraIncome);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", amount: 0, includeInBudget: false },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await addExtraIncome({
        name: data.name,
        amount: data.amount,
        includeInBudget: data.includeInBudget,
      });
      form.reset();
      onDone();
    } catch (e: unknown) {
      const message =
        e instanceof ConvexError
          ? String(e.data)
          : e instanceof Error
            ? e.message
            : "Error al agregar el ingreso";
      form.setError("root", { message });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-3 border-t">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="extra-income-name">Nombre</FieldLabel>
            <Input
              id="extra-income-name"
              placeholder="ej: Freelance"
              {...field}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="amount"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="extra-income-amount">Monto</FieldLabel>
            <Input
              id="extra-income-amount"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={field.value === 0 ? "" : field.value}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? 0 : Number(val));
              }}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="includeInBudget"
        control={form.control}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Switch
              id="extra-income-include"
              size="sm"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <label
              htmlFor="extra-income-include"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              ¿Incluir en tu presupuesto mensual?
            </label>
          </div>
        )}
      />
      {form.formState.errors.root && (
        <p className="text-destructive text-sm">
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Agregar
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            form.reset();
            onDone();
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
