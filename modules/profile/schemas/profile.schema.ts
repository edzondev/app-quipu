import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  country: z.string().min(1, "Selecciona un país"),
  currencyCode: z.string(),
  currencySymbol: z.string(),
  currencyName: z.string(),
  currencyLocale: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
