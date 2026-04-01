"use client";

import { Controller } from "react-hook-form";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/core/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { useEnvelopes } from "@/core/hooks/use-envelopes";
import { useProfile } from "@/core/hooks/use-profile";
import { cn } from "@/lib/utils";
import { useUpdateExpense } from "../hooks/use-update-expense";
import type { UpdateExpense } from "../schemas/update-expense.schema";

type Props = {
  expenseId: Id<"expenses">;
  defaultValues: UpdateExpense;
  onSuccess: () => void;
  className?: string;
};

export function EditExpenseForm({
  expenseId,
  defaultValues,
  onSuccess,
  className,
}: Props) {
  const { form, mutate } = useUpdateExpense({
    expenseId,
    defaultValues,
    onSuccess,
  });
  const { envelopes } = useEnvelopes();
  const { profile } = useProfile();

  if (!envelopes) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="h-14 animate-pulse rounded-md bg-muted" />
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  const symbol = profile?.currencySymbol ?? "S/";

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(mutate)}
    >
      <FieldGroup>
        {/* Envelope selector */}
        <Controller
          name="envelope"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>¿En qué sobre va este gasto?</FieldLabel>
              <div
                className={cn(
                  "grid gap-3",
                  profile?.coupleModeEnabled ? "grid-cols-3" : "grid-cols-2",
                )}
              >
                {envelopes.map((env) => (
                  <button
                    type="button"
                    key={env.key}
                    onClick={() => field.onChange(env.key)}
                    className={cn(
                      "rounded-xl border-2 p-5 text-left transition-colors",
                      field.value === env.key
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card",
                    )}
                  >
                    <span className="text-2xl">{env.emoji}</span>
                    <p className="mt-2 text-sm font-semibold">{env.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Disponible: {symbol} {env.available.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Monto */}
        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Monto</FieldLabel>
              <Input
                {...field}
                value={field.value === 0 ? "" : field.value}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? 0 : Number(val));
                }}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className="h-14 text-center text-xl"
                placeholder="0"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Descripción */}
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Descripción (opcional)</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="¿En qué gastaste?"
              />
            </Field>
          )}
        />

        {/* Root error */}
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        {/* Submit */}
        <Field>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-12 w-full"
          >
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
