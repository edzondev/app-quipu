import { z } from "zod";

export const updateExpenseSchema = z.object({
  amount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  envelope: z.enum(["needs", "wants", "juntos"]),
  description: z.string().optional(),
});

export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
