import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number(),
  envelope: z.enum(["needs", "wants", "juntos"]),
  date: z.string().optional(),
  description: z.string().optional(),
  bucket: z.enum(["needs", "wants", "savings"]).optional(),
  module: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;
