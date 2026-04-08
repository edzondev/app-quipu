import {
  Controller,
  useFormContext,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  OnboardingFormData,
  OnboardingFormOutput,
} from "@/modules/auth/validations/onboarding";

type Props = {
  form: UseFormReturn<OnboardingFormData>;
};

export default function StepIncome() {
  const { control, getValues, setValue, clearErrors } =
    useFormContext<OnboardingFormOutput>();
  const currencySymbol = useWatch({
    control: control,
    name: "currencySymbol",
  });
  const workerType = useWatch({
    control: control,
    name: "workerType",
  });
  const payFrequency = useWatch({
    control: control,
    name: "payFrequency",
  });
  const monthlyIncome = useWatch({
    control: control,
    name: "monthlyIncome",
  });

  const paydays = useWatch({
    control: control,
    name: "paydays",
  });
  const initialRemainingBudget = useWatch({
    control: control,
    name: "initialRemainingBudget",
  });

  const isIndependent = workerType === "independent";
  const todayDay = new Date().getDate();
  const isMidMonth =
    !isIndependent && paydays != null && !paydays.includes(todayDay);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Tus ingresos</h2>
        <p className="text-muted-foreground text-sm">
          {isIndependent
            ? "Establece una referencia de ingreso para tus metas."
            : "Define cuánto ganas y cuándo recibes tu pago."}
        </p>
      </div>

      <FieldGroup>
        <Controller
          name="monthlyIncome"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-income">
                {isIndependent
                  ? "¿Cuánto esperas ganar este mes?"
                  : `Ingreso mensual neto (${currencySymbol})`}
              </FieldLabel>
              {isIndependent && (
                <p className="text-xs text-muted-foreground -mt-1">
                  Es solo una referencia para tus metas. Puedes cambiarlo cuando
                  quieras.
                </p>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">
                  {currencySymbol}
                </span>
                <Input
                  id="onboarding-income"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  aria-invalid={fieldState.invalid}
                  className="pl-10 text-base font-semibold"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? 0 : Number(val));
                  }}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {!isIndependent && (
          <Controller
            name="payFrequency"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Frecuencia de pago</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: "monthly",
                        label: "Mensual",
                        sub: "1 pago al mes",
                      },
                      {
                        value: "biweekly",
                        label: "Quincenal",
                        sub: "2 pagos al mes",
                      },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        field.onChange(option.value);
                        setValue(
                          "paydays",
                          option.value === "monthly" ? [1] : [15, 30],
                        );
                        clearErrors("paydays");
                      }}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        field.value === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50",
                      )}
                    >
                      <p className="font-semibold text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.sub}
                      </p>
                    </button>
                  ))}
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
      </FieldGroup>

      {isMidMonth && monthlyIncome > 0 && (
        <div className="animate-in fade-in duration-300 rounded-xl border-2 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Hoy no es tu día de pago
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
              Como te estás registrando a mitad de mes, necesitamos saber cuánto
              te queda disponible para calcular tu presupuesto real hasta tu
              próximo día de pago.
            </p>
          </div>
          <Controller
            name="initialRemainingBudget"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="onboarding-remaining-budget">
                  ¿Cuánto te queda disponible de tu sueldo? ({currencySymbol}){" "}
                  <span className="text-destructive font-semibold">*</span>
                </FieldLabel>
                <p className="text-xs text-muted-foreground -mt-2">
                  Si no lo indicas, usaremos tu ingreso mensual completo como
                  referencia
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">
                    {currencySymbol}
                  </span>
                  <Input
                    id="onboarding-remaining-budget"
                    type="number"
                    min={0}
                    max={monthlyIncome}
                    step="any"
                    placeholder="0"
                    aria-invalid={fieldState.invalid}
                    className="pl-10 text-base font-semibold"
                    value={field.value == null ? "" : field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
                {field.value != null &&
                  field.value > 0 &&
                  field.value > monthlyIncome && (
                    <p className="text-xs text-amber-600">
                      El monto supera tu sueldo mensual
                    </p>
                  )}
              </Field>
            )}
          />
        </div>
      )}

      {monthlyIncome > 0 && (
        <div className="animate-in fade-in duration-300 rounded-xl bg-muted p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {isMidMonth && initialRemainingBudget != null
              ? "Vista previa — presupuesto con lo que te queda:"
              : `Vista previa — asignación ${payFrequency === "monthly" ? "mensual" : "por quincena"}:`}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              {
                label: "Necesidades",
                pct: 0.5,
                color: "text-envelope-needs",
              },
              { label: "Gustos", pct: 0.3, color: "text-envelope-wants" },
              { label: "Ahorro", pct: 0.2, color: "text-envelope-savings" },
            ].map((item) => {
              const base =
                isMidMonth && initialRemainingBudget != null
                  ? initialRemainingBudget
                  : payFrequency === "biweekly"
                    ? monthlyIncome / 2
                    : monthlyIncome;
              const amount = base * item.pct;
              return (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>
                    {currencySymbol} {amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          {!isMidMonth && payFrequency === "biweekly" && (
            <p className="text-xs text-muted-foreground text-center">
              × 2 quincenas = {currencySymbol} {monthlyIncome.toLocaleString()}{" "}
              / mes
            </p>
          )}
        </div>
      )}
    </div>
  );
}
