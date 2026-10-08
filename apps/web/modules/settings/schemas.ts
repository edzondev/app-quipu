import { z } from "zod";

export const displayNameSchema = z
	.string()
	.trim()
	.min(1, "El nombre es obligatorio.")
	.max(80, "Máximo 80 caracteres.");
