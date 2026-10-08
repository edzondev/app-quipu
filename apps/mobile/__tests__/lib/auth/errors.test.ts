import {
	CREDENTIALS_MESSAGE,
	mapOtpVerifyError,
	mapPasskeySignInError,
	passwordResetRedirectTo,
	shouldShowPasswordResetSent,
} from "@/shared/lib/auth/errors";

describe("mapPasskeySignInError", () => {
	it("traduce la cancelación de la ceremonia", () => {
		expect(mapPasskeySignInError({ code: "ERROR_CEREMONY_ABORTED" })).toEqual({
			tone: "warning",
			message: "Cancelaste la verificación. Puedes reintentar o usar tu respaldo.",
		});
	});

	it("trata AUTH_CANCELLED como cancelación", () => {
		expect(
			mapPasskeySignInError({ code: "AUTH_CANCELLED", message: "Auth cancelled" }).message,
		).toMatch(/Cancelaste/);
	});

	it("avisa si el teléfono no admite Passkeys", () => {
		expect(mapPasskeySignInError({ code: "NotSupportedError" }).message).toBe(
			"Este teléfono no admite Passkeys",
		);
	});

	it("no muestra el mensaje crudo cuando la passkey falla", () => {
		const notice = mapPasskeySignInError({
			code: "UNKNOWN_ERROR",
			message: "clientDataJSON leaked",
		});
		expect(notice.message).not.toMatch(/clientDataJSON/);
		expect(notice.tone).toBe("warning");
	});
});

describe("mapOtpVerifyError", () => {
	it("no inventa intentos si el servidor no los devuelve", () => {
		expect(mapOtpVerifyError({ code: "INVALID_OTP", message: "Invalid OTP" })).toBe(
			"El código no coincide.",
		);
	});

	it("muestra los intentos restantes solo cuando vienen en el error", () => {
		expect(
			mapOtpVerifyError({ code: "INVALID_OTP", message: "Invalid OTP", attemptsRemaining: 2 }),
		).toBe("El código no coincide. Te quedan 2 intentos.");
	});

	it("usa el singular cuando queda un intento", () => {
		expect(mapOtpVerifyError({ code: "INVALID_OTP", attemptsRemaining: 1 })).toBe(
			"El código no coincide. Te queda 1 intento.",
		);
	});

	it("pide un código nuevo cuando se agotan los intentos", () => {
		expect(mapOtpVerifyError({ status: 403, code: "TOO_MANY_ATTEMPTS" })).toBe(
			"Demasiados intentos. Pide un código nuevo.",
		);
	});

	it("distingue un código expirado", () => {
		expect(mapOtpVerifyError({ message: "OTP_EXPIRED" })).toBe("El código expiró. Pide uno nuevo.");
	});
});

describe("CREDENTIALS_MESSAGE", () => {
	it("no revela si el correo existe", () => {
		expect(CREDENTIALS_MESSAGE).toBe("Email o contraseña incorrectos");
	});
});

describe("shouldShowPasswordResetSent", () => {
	it("muestra el mismo resultado si la cuenta no existe", () => {
		expect(shouldShowPasswordResetSent(null)).toBe(true);
		expect(shouldShowPasswordResetSent({ code: "USER_NOT_FOUND", message: "User not found" })).toBe(
			true,
		);
	});

	it("no finge el envío cuando el servidor limita la petición", () => {
		expect(shouldShowPasswordResetSent({ status: 429, message: "Too many requests" })).toBe(false);
	});
});

describe("passwordResetRedirectTo", () => {
	it("arma una URL absoluta", () => {
		expect(passwordResetRedirectTo("https://quipu.test")).toBe(
			"https://quipu.test/restablecer-contrasena",
		);
	});

	it("rechaza una base que no es URL absoluta", () => {
		expect(passwordResetRedirectTo(undefined)).toBeNull();
		expect(passwordResetRedirectTo("/restablecer-contrasena")).toBeNull();
		expect(passwordResetRedirectTo("quipu://reset")).toBeNull();
	});
});
