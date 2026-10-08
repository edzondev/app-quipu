import { z } from "zod";

export const simpleCorrectionWizardSchema = z
	.object({
		incomeCents: z.number().int().positive("El ingreso debe ser mayor a 0."),
		reservedMode: z.enum(["none", "existing", "create", "generic"]),
		reservedCents: z.number().int().nonnegative("El monto apartado no puede ser negativo."),
		commitmentId: z.string().optional(),
		newCommitment: z
			.object({
				name: z.string().trim().min(1, "Ponle un nombre al compromiso."),
				amountCents: z.number().int().positive("La cuota debe ser mayor a 0."),
				dueDay: z
					.number()
					.int()
					.min(1, "El día de pago debe estar entre 1 y 31.")
					.max(31, "El día de pago debe estar entre 1 y 31."),
				envelope: z.enum(["needs", "wants"]),
			})
			.optional(),
		targets: z.object({
			needs: z.number().int().nonnegative(),
			wants: z.number().int().nonnegative(),
			savings: z.number().int().nonnegative(),
		}),
	})
	.refine((data) => data.reservedCents <= data.incomeCents, {
		message: "Lo apartado no puede superar lo ingresado.",
		path: ["reservedCents"],
	})
	.refine((data) => data.reservedMode === "none" || data.reservedCents >= 1, {
		message: "Pon el monto que vas a apartar.",
		path: ["reservedCents"],
	})
	.refine((data) => data.reservedMode !== "existing" || Boolean(data.commitmentId), {
		message: "Elige el compromiso para tu reserva.",
		path: ["commitmentId"],
	})
	.refine((data) => data.reservedMode !== "create" || data.newCommitment != null, {
		message: "Completa los datos del nuevo compromiso.",
		path: ["newCommitment"],
	});

export type SimpleCorrectionWizardValues = z.infer<typeof simpleCorrectionWizardSchema>;
