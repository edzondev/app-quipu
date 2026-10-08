import { z } from "zod";

export const feedbackCategorySchema = z.enum(["problem", "improvement", "question"]);

export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;

export const submitFeedbackInputSchema = z.object({
	category: feedbackCategorySchema,
	message: z
		.string()
		.trim()
		.min(10, "El mensaje debe tener al menos 10 caracteres.")
		.max(2000, "El mensaje debe tener como máximo 2000 caracteres."),
	pagePath: z.string().trim().max(200, "La ruta es demasiado larga.").optional(),
	userAgent: z.string().trim().max(500).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackInputSchema>;

export function createFeedbackFormSchema() {
	return submitFeedbackInputSchema.pick({
		category: true,
		message: true,
	});
}

export type FeedbackFormValues = z.infer<ReturnType<typeof createFeedbackFormSchema>>;
