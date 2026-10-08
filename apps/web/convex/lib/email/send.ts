import { Resend } from "resend";
import { z } from "zod";
import { isDevelopmentDeployment } from "../deployment";
import { assertEmailAllowed } from "./domainPolicy";

export const outboundEmailSchema = z.object({
	to: z.email(),
	subject: z.string().min(1),
	html: z.string().min(1),
	text: z.string().optional(),
	idempotencyKey: z.string().min(1).max(256).optional(),
});

export type OutboundEmail = z.infer<typeof outboundEmailSchema>;

/**
 * Envía email transaccional vía Resend SDK. Solo desde Convex.
 * Sin RESEND_API_KEY: warning y no-op (dev local).
 */
export async function sendOutboundEmail(params: OutboundEmail): Promise<void> {
	const { to, subject, html, text, idempotencyKey } = outboundEmailSchema.parse(params);
	assertEmailAllowed(to);

	if (isDevelopmentDeployment()) {
		console.log("[Quipu dev] sendOutboundEmail omitido — Resend desactivado.", subject, "→", to);
		return;
	}

	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		console.warn("RESEND_API_KEY no configurada; email no enviado:", subject, "→", to);
		return;
	}

	const from = process.env.RESEND_FROM;
	if (!from) {
		console.warn("RESEND_FROM no configurada; usando remitente de prueba de Resend.");
	}

	const fromAddress = from ?? "Quipu <onboarding@resend.dev>";
	const resend = new Resend(apiKey);

	const { error } = await resend.emails.send(
		{
			from: fromAddress,
			to,
			subject,
			html,
			text,
		},
		idempotencyKey ? { idempotencyKey } : undefined,
	);

	if (error) {
		console.error("Resend error:", error);
		throw new Error("No pudimos enviar el correo. Intenta más tarde.");
	}
}
