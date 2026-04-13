import { z } from "zod";

export const registerExpenseSchema = z.object({
  amount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  description: z.string().optional(),
  bucket: z.enum(["needs", "wants", "savings"]),
  module: z.string().min(1, "El módulo es requerido"),
  envelope: z.enum(["needs", "wants", "juntos"]),
  registeredBy: z.enum(["user", "partner"]),
});

export type RegisterExpense = z.infer<typeof registerExpenseSchema>;
