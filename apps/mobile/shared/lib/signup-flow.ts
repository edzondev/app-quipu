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

type OtpVerifyError = {
	status?: number;
	message?: string;
	statusText?: string;
};

/**
 * Mapea el error de verify-email al mensaje de UI. TOO_MANY_ATTEMPTS llega
 * con status 403 (FORBIDDEN) y/o message "Too many attempts"; 429 u
 * OTP_EXPIRED/INVALID_OTP caen en el genérico.
 */
export function mapOtpVerifyError(error: OtpVerifyError): string {
	const tooMany =
		error.status === 429 ||
		/TOO_MANY|too many/i.test([error.message, error.statusText].filter(Boolean).join(" "));
	return tooMany ? "Demasiados intentos. Pide un código nuevo." : "Código incorrecto o expirado";
}

type SignUpError = {
	code?: string;
	message?: string;
};

/**
 * Wizard idempotente: si la cuenta ya existe seguimos al paso 2; el OTP
 * prueba la propiedad del email (sin la contraseña correcta no hay sesión).
 */
export function isUserAlreadyExistsError(error: SignUpError): boolean {
	const haystack = [error.code, error.message].filter(Boolean).join(" ");
	return /user[\s_]?already[\s_]?exists/i.test(haystack);
}

/**
 * Guard de idempotencia del envío del OTP: envía solo la primera vez por
 * email (back → adelante con el mismo email NO re-envía; con email nuevo sí).
 */
export function shouldSendOtp(requestedFor: string | null, email: string): boolean {
	return requestedFor !== email;
}
