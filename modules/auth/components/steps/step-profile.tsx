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
import { Input } from "@/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import {
  COUNTRY_CONFIG,
  OnboardingFormOutput,
  type OnboardingFormData,
} from "@/modules/auth/validations/onboarding";

type Props = {
  form: UseFormReturn<OnboardingFormData>;
};

export default function StepProfile() {
  const { control, setValue } = useFormContext<OnboardingFormOutput>();

  const currencyCode = useWatch({
    control: control,
    name: "currencyCode",
  });
  const currencyName = useWatch({
    control: control,
    name: "currencyName",
  });
  const currencySymbol = useWatch({
    control: control,
    name: "currencySymbol",
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Cuéntanos sobre ti
        </h2>
        <p className="text-muted-foreground text-sm">
          Configura tu perfil para personalizar tu experiencia.
        </p>
      </div>

      <FieldGroup>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-name">Nombre completo</FieldLabel>
              <Input
                {...field}
                id="onboarding-name"
                type="text"
                placeholder="¿Cómo te llamas?"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-country">
                País y moneda
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  const config = COUNTRY_CONFIG.find(
                    (c) => c.country === value,
                  );
                  if (config) {
                    setValue("currencyCode", config.currencyCode);
                    setValue("currencySymbol", config.currencySymbol);
                    setValue("currencyName", config.currencyName);
                    setValue("currencyLocale", config.currencyLocale);
                  }
                }}
              >
                <SelectTrigger
                  id="onboarding-country"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CONFIG.map((c) => (
                    <SelectItem key={c.country} value={c.country}>
                      {c.country} — {c.currencySymbol} {c.currencyCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {currencyCode && (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            Moneda seleccionada:{" "}
            <span className="font-medium text-foreground">
              {currencyName} ({currencySymbol})
            </span>
          </div>
        )}
      </FieldGroup>
    </div>
  );
}
