"use client";

import { Controller } from "react-hook-form";
import { Button } from "@/core/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { cn } from "@/lib/utils";
import { useRegisterExpense } from "../hooks/use-register-expense";

export function RegisterExpenseForm() {
  const { form, mutate, profile, envelopes } = useRegisterExpense();

  if (!envelopes) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
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
    <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(mutate)}>
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Registrar gasto</h1>
          <p className="text-sm text-muted-foreground">
            ¿En qué sobre va este gasto?
          </p>
        </div>

        {/* Envelope selector */}
        <Controller
          name="envelope"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="grid grid-cols-3 gap-3">
                {envelopes.map((env) => (
                  <button
                    type="button"
                    key={env.key}
                    onClick={() => field.onChange(env.key)}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-colors",
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

        {/* ¿Quién registra? — couple mode only */}
        {profile?.coupleModeEnabled && (
          <Controller
            name="registeredBy"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>¿Quién registra?</FieldLabel>
                <div className="flex gap-3">
                  {(
                    [
                      { value: "user" as const, name: profile.name },
                      {
                        value: "partner" as const,
                        name: profile.couplePartnerName,
                      },
                    ] as const
                  ).map(({ value, name }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm transition-colors",
                        field.value === value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted",
                      )}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {name[0]?.toUpperCase()}
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          />
        )}

        {/* Monto */}
        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Monto</FieldLabel>
              <Input
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
              <Input {...field} placeholder="¿En qué gastaste?" />
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
            {form.formState.isSubmitting ? "Registrando..." : "Registrar gasto"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
