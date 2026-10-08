export type AuthNoticeCopy = {
	tone: "warning" | "info" | "danger";
	message: string;
	actionLabel?: string;
};

const PASSKEY_CANCELLED = "Cancelaste la verificación. Puedes reintentar o usar tu respaldo.";
const PASSKEY_UNAVAILABLE = "Este teléfono no admite Passkeys";
const PASSKEY_FAILED = "No pudimos usar la Passkey. Entra con tu respaldo.";
const OTP_MISMATCH = "El código no coincide.";
const OTP_EXPIRED = "El código expiró. Pide uno nuevo.";
const OTP_TOO_MANY = "Demasiados intentos. Pide un código nuevo.";

export const CREDENTIALS_MESSAGE = "Email o contraseña incorrectos";

function readString(error: unknown, key: string): string | null {
	if (!error || typeof error !== "object" || !(key in error)) return null;
	const value = Reflect.get(error, key);
	return typeof value === "string" ? value : null;
}

function readStatus(error: unknown): number | null {
	if (!error || typeof error !== "object" || !("status" in error)) return null;
	const value = Reflect.get(error, "status");
	return typeof value === "number" ? value : null;
}

/** Better Auth 1.6 no manda este número. Solo se lee si el servidor lo agrega. */
function readAttempts(error: unknown): number | null {
	if (!error || typeof error !== "object") return null;
	for (const key of ["attemptsRemaining", "remainingAttempts"]) {
		if (!(key in error)) continue;
		const value = Reflect.get(error, key);
		if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
	}
	return null;
}

function blob(error: unknown): string {
	return [readString(error, "code"), readString(error, "message"), readString(error, "statusText")]
		.filter(Boolean)
		.join(" ");
}

export function mapPasskeySignInError(error: unknown): AuthNoticeCopy {
	const code = readString(error, "code") ?? "";
	const message = readString(error, "message") ?? "";
	const text = `${code} ${message}`;
	if (/notsupported|not supported|no admite/i.test(text)) {
		return { tone: "warning", message: PASSKEY_UNAVAILABLE };
	}
	if (
		code === "ERROR_CEREMONY_ABORTED" ||
		code === "AUTH_CANCELLED" ||
		/ceremony_aborted|cancel/i.test(message)
	) {
		return { tone: "warning", message: PASSKEY_CANCELLED };
	}
	return { tone: "warning", message: PASSKEY_FAILED };
}

export function isEmailNotVerified(error: unknown): boolean {
	if (readString(error, "code") === "EMAIL_NOT_VERIFIED") return true;
	const message = readString(error, "message")?.toLowerCase() ?? "";
	return message.includes("not verified") || message.includes("verify your email");
}

export function mapOtpVerifyError(error: unknown): string {
	const text = blob(error);
	if (readStatus(error) === 429 || /too_many|too many/i.test(text)) return OTP_TOO_MANY;
	if (/otp_expired|otp expired/i.test(text)) return OTP_EXPIRED;
	const attempts = readAttempts(error);
	if (attempts == null) return OTP_MISMATCH;
	if (attempts === 1) return "El código no coincide. Te queda 1 intento.";
	return `El código no coincide. Te quedan ${attempts} intentos.`;
}

export function shouldShowPasswordResetSent(error: unknown): boolean {
	if (error == null) return true;
	if (readStatus(error) === 429) return false;
	const text = blob(error);
	if (/too_many|too many|rate limit/i.test(text)) return false;
	return /user_not_found|user not found/i.test(text);
}

/** URL absoluta del restablecimiento en la web. Rechaza rutas y esquemas de app. */
export function passwordResetRedirectTo(siteUrl: string | undefined): string | null {
	if (!siteUrl) return null;
	const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
	let url: URL;
	try {
		url = new URL(`${base}/restablecer-contrasena`);
	} catch {
		return null;
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") return null;
	if (!url.hostname) return null;
	return url.toString();
}
