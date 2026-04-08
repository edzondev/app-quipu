import {
  Controller,
  useFormContext,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Slider } from "@/core/components/ui/slider";
import { PiggyBank } from "lucide-react";
import {
  OnboardingFormOutput,
  type OnboardingFormData,
} from "@/modules/auth/validations/onboarding";

type Props = {
  form: UseFormReturn<OnboardingFormData>;
};

type AllocKey = "allocationNeeds" | "allocationWants" | "allocationSavings";

const ENVELOPE_CONFIG: {
  key: AllocKey;
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  {
    key: "allocationNeeds",
    label: "Necesidades",
    icon: "🏠",
    bgColor: "bg-envelope-needs",
    textColor: "text-white",
    borderColor: "border-envelope-needs",
  },
  {
    key: "allocationWants",
    label: "Gustos",
    icon: "🎉",
    bgColor: "bg-envelope-wants",
    textColor: "text-white",
    borderColor: "border-envelope-wants",
  },
  {
    key: "allocationSavings",
    label: "Ahorro",
    icon: "💰",
    bgColor: "bg-envelope-savings",
    textColor: "text-white",
    borderColor: "border-envelope-savings",
  },
];

const OTHER_KEYS: Record<AllocKey, [AllocKey, AllocKey]> = {
  allocationNeeds: ["allocationWants", "allocationSavings"],
  allocationWants: ["allocationNeeds", "allocationSavings"],
  allocationSavings: ["allocationNeeds", "allocationWants"],
};

function adjustProportionally(
  changed: AllocKey,
  newValue: number,
  current: Record<AllocKey, number>,
): Record<AllocKey, number> {
  const [keyA, keyB] = OTHER_KEYS[changed];
  const remaining = 100 - newValue;
  const currentOtherTotal = current[keyA] + current[keyB];

  let newA: number;
  let newB: number;

  if (currentOtherTotal === 0) {
    newA = Math.round(remaining / 2);
    newB = remaining - newA;
  } else {
    const ratioA = current[keyA] / currentOtherTotal;
    newA = Math.round(remaining * ratioA);
    newB = remaining - newA;
  }

  newA = Math.max(5, newA);
  newB = Math.max(5, newB);

  if (newA + newB !== remaining) {
    newB = remaining - newA;
  }

  return {
    ...current,
    [changed]: newValue,
    [keyA]: newA,
    [keyB]: newB,
  };
}

export default function StepPlan() {
  const { control, getValues, setValue } =
    useFormContext<OnboardingFormOutput>();
  const monthlyIncome = useWatch({
    control: control,
    name: "monthlyIncome",
  });
  const currencySymbol = useWatch({
    control: control,
    name: "currencySymbol",
  });
  const needs = useWatch({
    control: control,
    name: "allocationNeeds",
  });
  const wants = useWatch({
    control: control,
    name: "allocationWants",
  });
  const savings = useWatch({
    control: control,
    name: "allocationSavings",
  });

  const total = needs + wants + savings;

  const handleSliderChange = (key: AllocKey, value: number) => {
    const current = {
      allocationNeeds: getValues("allocationNeeds"),
      allocationWants: getValues("allocationWants"),
      allocationSavings: getValues("allocationSavings"),
    };
    const adjusted = adjustProportionally(key, value, current);
    setValue("allocationNeeds", adjusted.allocationNeeds, {
      shouldValidate: false,
    });
    setValue("allocationWants", adjusted.allocationWants, {
      shouldValidate: false,
    });
    setValue("allocationSavings", adjusted.allocationSavings, {
      shouldValidate: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Tu plan 50 / 30 / 20
        </h2>
        <p className="text-muted-foreground text-sm">
          Ajusta los porcentajes si lo deseas, o usa la recomendación.
        </p>
      </div>

      <FieldGroup>
        {ENVELOPE_CONFIG.map(({ key, label, icon, bgColor }) => (
          <Controller
            key={key}
            name={key}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel className="mb-0">
                    {icon} {label}
                  </FieldLabel>
                  <span className="text-sm font-bold tabular-nums">
                    {field.value}%
                  </span>
                </div>
                <Slider
                  value={[field.value]}
                  onValueChange={([v]) => {
                    if (v !== undefined) handleSliderChange(key, v);
                  }}
                  min={5}
                  max={80}
                  step={5}
                  className={`[&_[role=slider]]:${bgColor}`}
                />
                {monthlyIncome > 0 && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    {currencySymbol}{" "}
                    {(monthlyIncome * (field.value / 100)).toLocaleString(
                      "es-PE",
                      { maximumFractionDigits: 0 },
                    )}{" "}
                    / mes
                  </p>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </FieldGroup>

      {total !== 100 && (
        <p className="text-sm text-destructive font-medium">
          Los porcentajes deben sumar 100% — actualmente suman {total}%
        </p>
      )}

      {monthlyIncome > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {ENVELOPE_CONFIG.map(({ key, label, icon, bgColor, borderColor }) => {
            const alloc =
              key === "allocationNeeds"
                ? needs
                : key === "allocationWants"
                  ? wants
                  : savings;
            const amount = monthlyIncome * (alloc / 100);
            return (
              <div
                key={key}
                className={`rounded-xl border-2 ${borderColor} bg-card p-3 text-center space-y-1`}
              >
                <div className="text-xl">{icon}</div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                  className={`text-sm font-bold text-envelope-${key === "allocationNeeds" ? "needs" : key === "allocationWants" ? "wants" : "savings"}`}
                >
                  {currencySymbol}{" "}
                  {amount.toLocaleString("es-PE", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border-2 border-envelope-savings bg-muted p-4 text-center space-y-1.5">
        <PiggyBank className="w-7 h-7 mx-auto text-envelope-savings" />
        {monthlyIncome > 0 ? (
          <p className="text-sm font-medium">
            Cada mes, {currencySymbol}{" "}
            {(monthlyIncome * (savings / 100)).toLocaleString("es-PE", {
              maximumFractionDigits: 0,
            })}{" "}
            se asignarán automáticamente a tu ahorro.
          </p>
        ) : (
          <p className="text-sm font-medium">
            Pagarte a ti primero es la clave.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          El ahorro se separa antes que cualquier gasto.
        </p>
      </div>
    </div>
  );
}
