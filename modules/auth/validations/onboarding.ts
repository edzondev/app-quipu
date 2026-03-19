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

export const stepTwoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  country: z.string().min(1, "Selecciona un país."),
  currencyCode: z.string().min(1, "Selecciona una moneda"),
  currencySymbol: z.string().min(1),
  currencyName: z.string().min(1),
  currencyLocale: z.string().min(1),
});

export const stepWorkerTypeSchema = z.object({
  workerType: z.enum(["dependent", "independent"], {
    error: "Selecciona tu tipo de ingreso",
  }),
});

export const stepThreeSchema = z
  .object({
    workerType: z.enum(["dependent", "independent"]),
    monthlyIncome: z
      .number({ error: "Ingresa tu ingreso mensual" })
      .positive("El ingreso debe ser un número")
      .min(1, "El ingreso debe ser mayor a 0"),
    estimatedMonthlyIncome: z.optional(
      z.number().positive("El ingreso debe ser mayor a 0"),
    ),
    payFrequency: z.optional(
      z.enum(["monthly", "biweekly"], {
        error: "Selecciona la frecuencia de pago",
      }),
    ),
    paydays: z.optional(
      z.array(
        z
          .number()
          .int()
          .min(1, "El día debe ser entre 1 y 31")
          .max(31, "El día debe ser entre 1 y 31"),
      ),
    ),
    initialRemainingBudget: z.optional(
      z.number().min(0, "El monto debe ser mayor o igual a 0"),
    ),
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

export const stepFourSchema = z
  .object({
    allocationNeeds: z
      .number({ error: "Ingresa un porcentaje" })
      .int()
      .positive("El porcentaje debe ser mayor a 0"),
    allocationWants: z
      .number({ error: "Ingresa un porcentaje" })
      .int()
      .positive("El porcentaje debe ser mayor a 0"),
    allocationSavings: z
      .number({ error: "Ingresa un porcentaje" })
      .int()
      .positive("El porcentaje debe ser mayor a 0"),
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

export const onboardingSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    country: z.string().min(1, "Selecciona un país"),
    currencyCode: z.string().min(1),
    currencySymbol: z.string().min(1),
    currencyName: z.string().min(1),
    currencyLocale: z.string().min(1),
    workerType: z.enum(["dependent", "independent"]),
    monthlyIncome: z
      .number({ error: "Ingresa tu ingreso mensual" })
      .positive("El ingreso debe ser mayor a 0"),
    estimatedMonthlyIncome: z.optional(z.number().positive()),
    payFrequency: z.optional(z.enum(["monthly", "biweekly"])),
    paydays: z.optional(z.array(z.number().int().min(1).max(31))),
    initialRemainingBudget: z.optional(
      z.number().min(0, "El monto debe ser mayor o igual a 0"),
    ),
    allocationNeeds: z.number().int().positive(),
    allocationWants: z.number().int().positive(),
    allocationSavings: z.number().int().positive(),
  })
  .refine(
    (data) =>
      data.allocationNeeds + data.allocationWants + data.allocationSavings ===
      100,
    {
      message: "Los porcentajes deben sumar exactamente 100%",
      path: ["allocationNeeds"],
    },
  )
  .refine(
    (data) =>
      data.initialRemainingBudget === undefined ||
      data.initialRemainingBudget <= data.monthlyIncome,
    {
      message: "El monto no puede superar tu ingreso mensual",
      path: ["initialRemainingBudget"],
    },
  );

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
