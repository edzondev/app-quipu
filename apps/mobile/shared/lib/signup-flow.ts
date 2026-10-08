// Lógica de decisión del wizard de registro (create-account), extraída
// a funciones puras para poder testearla. Espeja los flujos de la batería
// de pruebas en device — ver docs/LANZAMIENTO-CHECKLIST.md.

/** Input del OTP saneado: solo dígitos, máximo 6. */
export function parseOtpInput(raw: string): string {
	return raw.replace(/\D/g, "").slice(0, 6);
}

/** Auto-verificación exactamente al completar los 6 dígitos. */
export function shouldAutoVerifyOtp(code: string): boolean {
	return code.length === 6;
}

/**
 * Guard de idempotencia del envío del OTP: envía solo la primera vez por
 * email (back → adelante con el mismo email NO re-envía; con email nuevo sí).
 */
export function shouldSendOtp(requestedFor: string | null, email: string): boolean {
	return requestedFor !== email;
}
