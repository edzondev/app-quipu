import { z } from "zod";
import { limaIncomeDateMinTimestamp, limaStartOfDay } from "@/shared/lib/date";
import { EXTRAORDINARY_TYPES } from "@/shared/lib/extraordinaryIncome";
import { INCOME_MAX_CENTS } from "./constants";
import type { IncomeSource } from "./types";

const incomeSourceValues = [
	"payroll",
	"freelance",
	"business",
	"gift",
	"refund",
	"investment",
	"other",
] as const satisfies readonly IncomeSource[];

const distributionPolicyValues = ["profile_default", "all_to_savings"] as const;

export function createIncomeRegisterSchema(now: number = Date.now()) {
	const maxOccurredAt = limaStartOfDay(now);
	const minOccurredAt = limaIncomeDateMinTimestamp(now);

	return z
		.object({
			incomeKind: z.enum(["habitual", "extraordinary"]),
			amountCents: z
				.number()
				.int("El monto debe ser un número entero.")
				.min(1, "Ingresa un monto mayor a cero.")
				.max(INCOME_MAX_CENTS, "El monto supera el máximo permitido para registrar."),
			source: z.enum(incomeSourceValues, {
				error: "Elige un origen para el ingreso.",
			}),
			concept: z.string().max(120, "El concepto no puede superar 120 caracteres."),
			occurredAt: z
				.number()
				.int()
				.min(minOccurredAt, "La fecha es demasiado antigua para registrar este ingreso.")
				.max(maxOccurredAt, "La fecha no puede ser futura."),
			extraordinaryType: z.enum(EXTRAORDINARY_TYPES).optional(),
			extraordinaryLabel: z
				.string()
				.max(80, "La descripción no puede superar 80 caracteres.")
				.optional(),
			distributionPolicy: z.enum(distributionPolicyValues).optional(),
			// P3-4: optional hold before distribution. Integer cents, 0..amountCents.
			heldCents: z
				.number()
				.int("El monto apartado debe ser un número entero.")
				.min(0, "El monto apartado no puede ser negativo.")
				.optional(),
		})
		.superRefine((values, ctx) => {
			// Cross-field: heldCents cannot exceed amountCents.
			if (
				values.heldCents !== undefined &&
				values.amountCents > 0 &&
				values.heldCents > values.amountCents
			) {
				ctx.addIssue({
					code: "custom",
					message: "El monto apartado no puede superar el ingreso.",
					path: ["heldCents"],
				});
			}

			if (values.incomeKind === "extraordinary") {
				if (!values.extraordinaryType) {
					ctx.addIssue({
						code: "custom",
						message: "Elige un tipo de ingreso extraordinario.",
						path: ["extraordinaryType"],
					});
				}
				if (values.extraordinaryType === "custom") {
					const label = values.extraordinaryLabel?.trim() ?? "";
					if (!label) {
						ctx.addIssue({
							code: "custom",
							message: "Describe este ingreso (1–80 caracteres).",
							path: ["extraordinaryLabel"],
						});
					}
				}
				if (!values.distributionPolicy) {
					ctx.addIssue({
						code: "custom",
						message: "Confirma a dónde va este ingreso.",
						path: ["distributionPolicy"],
					});
				}
				return;
			}

			if (values.extraordinaryType || values.distributionPolicy) {
				ctx.addIssue({
					code: "custom",
					message: "Los campos extraordinarios no aplican a ingresos habituales.",
					path: ["incomeKind"],
				});
			}
		});
}

export type IncomeRegisterFormValues = z.infer<ReturnType<typeof createIncomeRegisterSchema>>;
