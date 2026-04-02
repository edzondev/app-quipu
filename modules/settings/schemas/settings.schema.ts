import { z } from "zod";

export const settingsSchema = z
  .object({
    payFrequency: z.enum(["monthly", "biweekly"]),
    allocationNeeds: z.number().min(0).max(100),
    allocationWants: z.number().min(0).max(100),
    allocationSavings: z.number().min(0).max(100),
    coupleModeEnabled: z.boolean(),
    couplePartnerName: z.string().optional(),
    coupleMonthlyBudget: z.number().min(0).optional(),
  })
  .refine(
    (d) => d.allocationNeeds + d.allocationWants + d.allocationSavings === 100,
    {
      message: "Los porcentajes deben sumar 100%",
      path: ["allocationNeeds"],
    },
  )
  .refine(
    (d) =>
      !d.coupleModeEnabled ||
      (d.couplePartnerName && d.couplePartnerName.length >= 2),
    {
      message: "Ingresa el nombre de tu pareja",
      path: ["couplePartnerName"],
    },
  );

export type SettingsFormValues = z.infer<typeof settingsSchema>;
