import { z } from "zod";

export const emailOnlySchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
});
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;
