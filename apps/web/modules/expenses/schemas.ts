import { z } from "zod";
import type { ExpenseEnvelopeType } from "@/modules/expenses/lib/envelopeSuggestion";
import { KEYPAD_MAX_CENTS } from "@/modules/expenses/lib/keypad";

const expenseEnvelopeValues = ["needs", "wants"] as const satisfies readonly ExpenseEnvelopeType[];

export function createExpenseRegisterSchema() {
	return z.object({
		amountCents: z
			.number()
			.int("El monto debe ser un número entero.")
			.min(1, "Ingresa un monto mayor a cero.")
			.max(KEYPAD_MAX_CENTS, "El monto supera el máximo permitido para registrar."),
		envelopeType: z.enum(expenseEnvelopeValues, {
			error: "Elige un sobre para el gasto.",
		}),
		description: z.string().max(120, "La descripción no puede superar 120 caracteres."),
	});
}

export type ExpenseRegisterFormValues = z.infer<ReturnType<typeof createExpenseRegisterSchema>>;

export const expenseRegisterSchema = createExpenseRegisterSchema();
