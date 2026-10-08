import { z } from "zod";
import { KEYPAD_MAX_CENTS } from "@/modules/expenses/lib/keypad";

export function parseAmountInputToCents(input: string): number | null {
	const normalized = input.trim().replace(",", ".");
	if (!normalized) return null;
	const amount = Number.parseFloat(normalized);
	if (Number.isNaN(amount) || amount <= 0) return null;
	const cents = Math.round(amount * 100);
	if (!Number.isInteger(cents) || cents <= 0) return null;
	return cents;
}

export function parseDueDayInput(input: string): number | null {
	const trimmed = input.trim();
	if (!trimmed) return null;
	const dueDay = Number.parseInt(trimmed, 10);
	if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return null;
	return dueDay;
}

export function createAddCommitmentFormSchema() {
	return z.strictObject({
		name: z
			.string()
			.trim()
			.min(1, "El nombre del compromiso es obligatorio.")
			.max(40, "El nombre no puede superar 40 caracteres."),
		amountInput: z
			.string()
			.trim()
			.min(1, "Ingresa un monto válido.")
			.superRefine((value, ctx) => {
				const cents = parseAmountInputToCents(value);
				if (cents === null) {
					ctx.addIssue({
						code: "custom",
						message: "El monto debe ser un entero de céntimos mayor a cero.",
					});
					return;
				}
				if (cents > KEYPAD_MAX_CENTS) {
					ctx.addIssue({
						code: "custom",
						message: "El monto supera el máximo permitido.",
					});
				}
			}),
		dueDayInput: z
			.string()
			.trim()
			.min(1, "Ingresa un día entre 1 y 31.")
			.superRefine((value, ctx) => {
				if (parseDueDayInput(value) === null) {
					ctx.addIssue({
						code: "custom",
						message: "El día de vencimiento debe ser un entero entre 1 y 31.",
					});
				}
			}),
		envelope: z.enum(["needs", "wants"], {
			error: "Elige un sobre para el compromiso.",
		}),
	});
}

export type AddCommitmentFormValues = z.infer<ReturnType<typeof createAddCommitmentFormSchema>>;

export const addCommitmentFormSchema = createAddCommitmentFormSchema();

export function toCreateFixedCommitmentPayload(value: AddCommitmentFormValues) {
	const amount = parseAmountInputToCents(value.amountInput);
	const dueDay = parseDueDayInput(value.dueDayInput);
	if (amount === null || dueDay === null) {
		throw new Error("Invalid commitment form values");
	}
	return {
		name: value.name.trim(),
		amount,
		envelope: value.envelope,
		dueDay,
	};
}
