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
    country: "Colombia",
    currencyCode: "COP",
    currencySymbol: "$",
    currencyName: "Peso colombiano",
    currencyLocale: "es-CO",
  },
  {
    country: "Mexico",
    currencyCode: "MXN",
    currencySymbol: "$",
    currencyName: "Peso mexicano",
    currencyLocale: "es-MX",
  },
  {
    country: "Argentina",
    currencyCode: "ARS",
    currencySymbol: "$",
    currencyName: "Peso argentino",
    currencyLocale: "es-AR",
  },
  {
    country: "España",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    currencyLocale: "es-ES",
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
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  country: z.string().min(1, "Selecciona un país"),
  currencyCode: z.string().min(1, "Selecciona una moneda"),
  currencySymbol: z.string().min(1),
  currencyName: z.string().min(1),
  currencyLocale: z.string().min(1),
});

export const stepThreeSchema = z
  .object({
    monthlyIncome: z
      .number({ error: "Ingresa tu ingreso mensual" })
      .positive("El ingreso debe ser mayor a 0"),
    payFrequency: z.enum(["monthly", "biweekly"], {
      error: "Selecciona la frecuencia de pago",
    }),
    paydays: z
      .array(
        z
          .number()
          .int()
          .min(1, "El día debe ser entre 1 y 31")
          .max(31, "El día debe ser entre 1 y 31"),
      )
      .min(1, "Selecciona al menos un día de pago"),
  })
  .refine(
    (data) => {
      if (data.payFrequency === "monthly") return data.paydays.length === 1;
      if (data.payFrequency === "biweekly") return data.paydays.length === 2;
      return false;
    },
    {
      message:
        "Selecciona 1 día para pago mensual o 2 días para pago quincenal",
      path: ["paydays"],
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
    monthlyIncome: z
      .number({ error: "Ingresa tu ingreso mensual" })
      .positive("El ingreso debe ser mayor a 0"),
    payFrequency: z.enum(["monthly", "biweekly"]),
    paydays: z
      .array(z.number().int().min(1).max(31))
      .min(1, "Selecciona al menos un día de pago"),
    allocationNeeds: z.number().int().positive(),
    allocationWants: z.number().int().positive(),
    allocationSavings: z.number().int().positive(),
  })
  .refine(
    (data) => {
      if (data.payFrequency === "monthly") return data.paydays.length === 1;
      if (data.payFrequency === "biweekly") return data.paydays.length === 2;
      return false;
    },
    {
      message:
        "Selecciona 1 día para pago mensual o 2 días para pago quincenal",
      path: ["paydays"],
    },
  )
  .refine(
    (data) =>
      data.allocationNeeds + data.allocationWants + data.allocationSavings ===
      100,
    {
      message: "Los porcentajes deben sumar exactamente 100%",
      path: ["allocationNeeds"],
    },
  );

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
