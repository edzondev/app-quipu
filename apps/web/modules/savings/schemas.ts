import { z } from "zod";
import { KEYPAD_MAX_CENTS } from "@/modules/expenses/lib/keypad";
import { parseOptionalTargetCents } from "./lib/savingsCopy";

export function createNewGoalSchema() {
	return z
		.object({
			label: z
				.string()
				.trim()
				.min(1, "El nombre de la meta es obligatorio.")
				.max(40, "El nombre de la meta debe tener como máximo 40 caracteres."),
			targetInput: z.string(),
		})
		.superRefine((data, ctx) => {
			const trimmed = data.targetInput.trim();
			if (!trimmed) return;

			const cents = parseOptionalTargetCents(data.targetInput);
			if (cents === undefined) {
				ctx.addIssue({
					code: "custom",
					message: "Ingresa un monto válido.",
					path: ["targetInput"],
				});
				return;
			}
			if (cents <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "La meta debe ser un monto mayor a cero.",
					path: ["targetInput"],
				});
				return;
			}
			if (cents > KEYPAD_MAX_CENTS) {
				ctx.addIssue({
					code: "custom",
					message: "El monto supera el máximo permitido para registrar.",
					path: ["targetInput"],
				});
			}
		});
}

export type NewGoalFormValues = z.infer<ReturnType<typeof createNewGoalSchema>>;

export function newGoalFormToMutationArgs(values: NewGoalFormValues) {
	return {
		label: values.label.trim(),
		targetAmount: parseOptionalTargetCents(values.targetInput),
	};
}

export const surplusFromEnvelopeValues = ["needs", "wants", "extraordinary"] as const;

export type SurplusFromEnvelope = (typeof surplusFromEnvelopeValues)[number];

export const moveSurplusInputSchema = z.object({
	fromEnvelope: z.enum(surplusFromEnvelopeValues),
	amount: z
		.number()
		.int("El monto debe ser un número entero de céntimos.")
		.positive("El monto debe ser mayor a cero.")
		.max(KEYPAD_MAX_CENTS, "El monto supera el máximo permitido."),
	toSubEnvelopeId: z.string().min(1, "Elige un destino.").optional(),
});

export type MoveSurplusInput = z.infer<typeof moveSurplusInputSchema>;

export function createMoveSurplusFormSchema(
	availableBySource: Record<SurplusFromEnvelope, number>,
) {
	return z
		.object({
			fromSource: z.enum(surplusFromEnvelopeValues),
			amountCents: z
				.number()
				.int("El monto debe ser un número entero de céntimos.")
				.positive("El monto debe ser mayor a cero.")
				.max(KEYPAD_MAX_CENTS, "El monto supera el máximo permitido."),
			destinationId: z.string().min(1, "Elige un destino."),
		})
		.superRefine((data, ctx) => {
			const available = availableBySource[data.fromSource];
			if (data.amountCents > available) {
				ctx.addIssue({
					code: "custom",
					message: "No puedes mover más del sobrante disponible.",
					path: ["amountCents"],
				});
			}
		});
}

export type MoveSurplusFormValues = z.infer<ReturnType<typeof createMoveSurplusFormSchema>>;

export function createContributeToSubEnvelopeSchema(availableCents: number) {
	return z
		.object({
			amountInput: z.string(),
		})
		.superRefine((data, ctx) => {
			const trimmed = data.amountInput.trim();
			if (!trimmed) return;

			const cents = parseOptionalTargetCents(data.amountInput);
			if (cents === undefined) {
				ctx.addIssue({
					code: "custom",
					message: "Ingresa un monto válido.",
					path: ["amountInput"],
				});
				return;
			}
			if (cents <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "El aporte debe ser mayor a cero.",
					path: ["amountInput"],
				});
				return;
			}
			if (cents > KEYPAD_MAX_CENTS) {
				ctx.addIssue({
					code: "custom",
					message: "El monto supera el máximo permitido.",
					path: ["amountInput"],
				});
				return;
			}
			if (cents > availableCents) {
				ctx.addIssue({
					code: "custom",
					message: "No tienes suficiente apartado en Ahorro.",
					path: ["amountInput"],
				});
			}
		});
}

export type ContributeToSubEnvelopeFormValues = z.infer<
	ReturnType<typeof createContributeToSubEnvelopeSchema>
>;

export const contributeToSubEnvelopeInputSchema = z.object({
	subEnvelopeId: z.string().min(1, "Meta no válida."),
	amountCents: z
		.number()
		.int("El monto debe ser un número entero de céntimos.")
		.positive("El monto debe ser mayor a cero.")
		.max(KEYPAD_MAX_CENTS, "El monto supera el máximo permitido.")
		.optional(),
});

export type ContributeToSubEnvelopeInput = z.infer<typeof contributeToSubEnvelopeInputSchema>;

export function contributeToSubEnvelopeFormToMutationArgs(
	subEnvelopeId: string,
	values: ContributeToSubEnvelopeFormValues,
	availableCents: number,
): ContributeToSubEnvelopeInput {
	const trimmed = values.amountInput.trim();
	const amountCents =
		trimmed === "" ? availableCents : parseOptionalTargetCents(values.amountInput);
	if (amountCents === undefined || amountCents <= 0) {
		throw new Error("Monto de aporte inválido.");
	}
	return {
		subEnvelopeId,
		amountCents,
	};
}

export function moveSurplusFormToMutationArgs(values: MoveSurplusFormValues): MoveSurplusInput {
	return {
		fromEnvelope: values.fromSource,
		amount: values.amountCents,
		toSubEnvelopeId: values.destinationId,
	};
}

export const assignSavingsInputSchema = z.object({
	lines: z
		.array(
			z.object({
				subEnvelopeId: z.string().min(1, "Destino no válido."),
				amountCents: z
					.number()
					.int("El monto debe ser un entero de céntimos.")
					.positive("El monto debe ser mayor a cero."),
			}),
		)
		.min(1, "Agrega al menos un destino."),
});

export type AssignSavingsInput = z.infer<typeof assignSavingsInputSchema>;
