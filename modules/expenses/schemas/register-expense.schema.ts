import { z } from "zod";

export const registerExpenseSchema = z.object({
  amount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  envelope: z.enum(["needs", "wants", "juntos"]),
  description: z.string().optional(),
  registeredBy: z.enum(["user", "partner"]),
});

export type RegisterExpense = z.infer<typeof registerExpenseSchema>;
