import { Briefcase, TrendingUp } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { cn } from "@/lib/utils";
import type { OnboardingFormData } from "@/modules/auth/validations/onboarding";

type Props = {
  form: UseFormReturn<OnboardingFormData>;
};

const OPTIONS = [
  {
    value: "dependent" as const,
    label: "Sueldo fijo",
    sub: "Cobro en fechas predecibles: mensual, quincenal o recibo de honorarios",
    icon: Briefcase,
  },
  {
    value: "independent" as const,
    label: "Ingresos variables",
    sub: "Trabajo independiente, cobro cuando hay trabajo",
    icon: TrendingUp,
  },
];

export default function StepWorkerType({ form }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Tipo de ingreso</h2>
        <p className="text-muted-foreground text-sm">
          Esto nos ayuda a adaptar la experiencia a tu forma de cobrar.
        </p>
      </div>

      <FieldGroup>
        <Controller
          name="workerType"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="sr-only">Tipo de trabajador</FieldLabel>
              <div className="grid gap-3">
                {OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "rounded-xl border-2 p-5 text-left transition-all flex items-start gap-4",
                        field.value === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                          field.value === option.value
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">
                          {option.label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {option.sub}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
}
