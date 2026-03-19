"use client";

import type { Preloaded } from "convex/react";
import { Controller } from "react-hook-form";
import type { api } from "@/convex/_generated/api";
import { PremiumBadge } from "@/core/components/shared/premium-badge";
import { PremiumGate } from "@/core/components/shared/premium-gate";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { Separator } from "@/core/components/ui/separator";
import { Slider } from "@/core/components/ui/slider";
import { Switch } from "@/core/components/ui/switch";
import { useSettings } from "../hooks/use-settings";
import { AddCommitmentDialog } from "./add-commitment-dialog";
import { CommitmentItem } from "./commitment-item";
import { DeleteAccountSection } from "./delete-account-section";

type Props = {
  preloaded: Preloaded<typeof api.profiles.getMyProfile>;
};

export default function SettingsView({ preloaded }: Props) {
  const {
    form,
    commitments,
    handleSubmit,
    handleDeleteCommitment,
    isSubmitting,
    profile,
  } = useSettings(preloaded);

  const { watch, control, formState } = form;
  const coupleModeEnabled = watch("coupleModeEnabled");
  const needsPct = watch("allocationNeeds");
  const wantsPct = watch("allocationWants");
  const savingsPct = watch("allocationSavings");
  const payFrequency = watch("payFrequency");

  const total = needsPct + wantsPct + savingsPct;
  const currencySymbol = profile?.currencySymbol ?? "$";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">Ajusta tu plan financiero.</p>
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="monthlyIncome"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-income">
                      Ingreso mensual neto ({currencySymbol})
                    </FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">
                        {currencySymbol}
                      </span>
                      <Input
                        id="settings-income"
                        type="number"
                        min={0}
                        step={100}
                        placeholder="0"
                        className="pl-10"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? 0 : Number(val));
                        }}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="payFrequency"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-pay-frequency">
                      Frecuencia de pago
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="settings-pay-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {payFrequency === "monthly"
                        ? "Recibes tu ingreso una vez al mes."
                        : "Recibes tu ingreso dos veces al mes."}
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Plan de asignación */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Plan de asignación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Controller
                name="allocationNeeds"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Necesidades</span>
                      <span className="text-muted-foreground">
                        {field.value}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </div>
                )}
              />
              <Controller
                name="allocationWants"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Gustos</span>
                      <span className="text-muted-foreground">
                        {field.value}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </div>
                )}
              />
              <Controller
                name="allocationSavings"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Ahorro</span>
                      <span className="text-muted-foreground">
                        {field.value}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </div>
                )}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total asignado</span>
              <span
                className={
                  total === 100
                    ? "text-green-600 font-semibold"
                    : "text-destructive font-semibold"
                }
              >
                {total}%
              </span>
            </div>
            {formState.errors.allocationNeeds && (
              <FieldError>
                {formState.errors.allocationNeeds.message}
              </FieldError>
            )}
          </CardContent>
        </Card>

        {/* Modo Pareja */}
        <PremiumGate featureName="Modo Pareja">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  👫 Modo Pareja
                  <PremiumBadge />
                </CardTitle>
                <Controller
                  name="coupleModeEnabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </CardHeader>
            {coupleModeEnabled && (
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="couplePartnerName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="couple-partner-name">
                          Nombre de tu pareja
                        </FieldLabel>
                        <Input
                          id="couple-partner-name"
                          placeholder="Ej: María"
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="coupleMonthlyBudget"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="couple-budget">
                          Presupuesto mensual de pareja ({currencySymbol})
                        </FieldLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">
                            {currencySymbol}
                          </span>
                          <Input
                            id="couple-budget"
                            type="number"
                            min={0}
                            step={100}
                            placeholder="0"
                            className="pl-10"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? 0 : Number(val));
                            }}
                          />
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            )}
          </Card>
        </PremiumGate>

        {formState.errors.root && (
          <p className="text-destructive text-sm">
            {formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>

      {/* Cuotas y deudas (outside main form, uses separate mutations) */}
      <PremiumGate featureName="Cuotas y deudas fijas">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Mis cuotas y deudas
              <PremiumBadge />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Pagos fijos que se descuentan antes de asignar tus sobres.
            </p>
            {commitments.length > 0 ? (
              <div className="divide-y">
                {commitments.map((c) => (
                  <CommitmentItem
                    key={c._id}
                    id={c._id}
                    name={c.name}
                    amount={c.amount}
                    envelope={c.envelope}
                    currencySymbol={currencySymbol}
                    onDelete={handleDeleteCommitment}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                No tienes cuotas registradas.
              </p>
            )}
            <Separator />
            <AddCommitmentDialog />
          </CardContent>
        </Card>
      </PremiumGate>

      <DeleteAccountSection />
    </div>
  );
}
