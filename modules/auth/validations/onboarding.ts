import { z } from "zod";

export const COUNTRY_CONFIG = [
  {
    country: "Peru",
    currencyCode: "PEN",
    currencySymbol: "S/",
    currencyName: "Sol peruano",
    currencyLocale: "es-PE",
  },
  {
    country: "Estados Unidos",
    currencyCode: "USD",
    currencySymbol: "$",
    currencyName: "Dólar estadounidense",
    currencyLocale: "en-US",
  },
] as const;

export const onboardingSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  country: z.string().min(1, "Selecciona un país"),
  currencyCode: z.string().min(1),
  currencySymbol: z.string().min(1),
  currencyName: z.string().min(1),
  currencyLocale: z.string().min(1),
  workerType: z.enum(["dependent", "independent"], {
    error: "Selecciona tu tipo de ingreso",
  }),
  monthlyIncome: z.number().positive(),
  estimatedMonthlyIncome: z.optional(z.number().positive()),
  payFrequency: z.optional(z.enum(["monthly", "biweekly"])),
  paydays: z.optional(z.array(z.number().int().min(1).max(31))),
  initialRemainingBudget: z.optional(
    z.number().min(0, "El monto debe ser mayor o igual a 0"),
  ),
  allocationNeeds: z.number().int().positive(),
  allocationWants: z.number().int().positive(),
  allocationSavings: z.number().int().positive(),
});

export const stepTwoSchema = onboardingSchema.pick({
  name: true,
  country: true,
  currencyCode: true,
  currencySymbol: true,
  currencyName: true,
  currencyLocale: true,
});

export const stepWorkerTypeSchema = onboardingSchema.pick({
  workerType: true,
});

export const stepThreeSchema = onboardingSchema
  .pick({
    monthlyIncome: true,
    estimatedMonthlyIncome: true,
    payFrequency: true,
    paydays: true,
    initialRemainingBudget: true,
  })
  .refine(
    (data) =>
      data.initialRemainingBudget === undefined ||
      data.initialRemainingBudget <= data.monthlyIncome,
    {
      message: "El monto no puede superar tu ingreso mensual",
      path: ["initialRemainingBudget"],
    },
  );

export const stepFourSchema = onboardingSchema
  .pick({
    allocationNeeds: true,
    allocationWants: true,
    allocationSavings: true,
  })
  .refine(
    (data) =>
      data.allocationNeeds + data.allocationWants + data.allocationSavings ===
      100,
    {
      message: "Los porcentajes deben sumar exactamente 100%",
      path: ["allocationNeeds"],
    },
  );

export const stepWelcomeSchema = z.object({});

export const stepSchemas = [
  stepWelcomeSchema,
  stepTwoSchema,
  stepWorkerTypeSchema,
  stepThreeSchema,
  stepFourSchema,
] as const;
export const STEP_COUNT = stepSchemas.length;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
export type OnboardingFormInput = z.input<typeof onboardingSchema>;
export type OnboardingFormOutput = z.output<typeof onboardingSchema>;
export type StepFields = Array<keyof OnboardingFormInput>;

export const stepFields = stepSchemas.map(
  (schema) => Object.keys(schema.shape) as StepFields,
);

export const defaultValues: OnboardingFormInput = {
  name: "",
  country: "",
  currencyCode: "",
  currencySymbol: "",
  currencyName: "",
  currencyLocale: "",
  workerType: "independent",
  monthlyIncome: 0,
  estimatedMonthlyIncome: undefined,
  payFrequency: undefined,
  paydays: undefined,
  initialRemainingBudget: undefined,
  allocationNeeds: 0,
  allocationWants: 0,
  allocationSavings: 0,
};
