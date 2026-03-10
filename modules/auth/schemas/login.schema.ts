import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({
    error: "El email es inválido",
  }),
  password: z
    .string({ error: "La contraseña es inválida" })
    .min(1, { error: "La contraseña es requerida" }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
