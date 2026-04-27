"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "convex/react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Button } from "@/core/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { currentMonthString } from "@/lib/utils";
import { usePauseMode } from "../hooks/use-pause-mode";

const schema = z.object({
  liquidation: z
    .number({ error: "Ingresa un monto válido" })
    .min(0, "El monto no puede ser negativo"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onDone: () => void;
};

export function PauseModeForm({ onDone }: Props) {
  const { activate, isActivating } = usePauseMode();
  const month = currentMonthString();
  const preview = useQuery(api.pauseMode.getPauseModeActivationPreview, {
    month,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { liquidation: 0 },
  });

  const liquidation = form.watch("liquidation") ?? 0;
  const carryover = preview?.carryover ?? 0;
  const totalFund = liquidation + carryover;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await activate(data.liquidation, month);
      form.reset();
      onDone();
    } catch {
      // Toast already shown by the hook; keep the form open so the user can retry
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-3 border-t">
      <p className="text-sm text-muted-foreground">
        Si estás entre trabajos, ingresa tu liquidación u otro ingreso único.
        Quipu sumará ese monto con tu saldo disponible actual en Necesidades y
        Gustos para definir tu fondo total.
      </p>
      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">
          Saldo actual en sobres (Necesidades + Gustos):{" "}
          <span className="font-medium tabular-nums text-foreground">
            {preview
              ? `${preview.currencySymbol} ${carryover.toLocaleString("es", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}`
              : "Calculando..."}
          </span>
        </p>
        <p className="text-muted-foreground">
          Total a administrar:{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {preview
              ? `${preview.currencySymbol} ${totalFund.toLocaleString("es", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}`
              : "Calculando..."}
          </span>
        </p>
      </div>
      <Controller
        name="liquidation"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="pause-mode-liquidation" className="sr-only">
              Liquidación u otro ingreso único
            </FieldLabel>
            <Input
              id="pause-mode-liquidation"
              type="number"
              min={0}
              step="any"
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
      <div className="flex gap-2">
        <Button type="submit" disabled={isActivating}>
          {isActivating ? "Activando..." : "Activar Modo Pausa"}
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
