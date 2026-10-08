import { z } from "zod";

export const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(1, "El email es obligatorio")
	.pipe(z.email("Email inválido"));
