import { z } from "zod";

export const signUpSchema = z.object({
	name: z.string().trim().min(2, "Escribe tu nombre"),
	email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
	password: z.string().min(8, "Mínimo 8 caracteres"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const passwordOnlySchema = z.object({
	password: z.string().min(1, "La contraseña es requerida"),
});
export type PasswordOnlyInput = z.infer<typeof passwordOnlySchema>;
