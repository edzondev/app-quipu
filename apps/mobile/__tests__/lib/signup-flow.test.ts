import {
	isUserAlreadyExistsError,
	mapOtpVerifyError,
	parseOtpInput,
	shouldAutoVerifyOtp,
	shouldSendOtp,
} from "@/shared/lib/signup-flow";

describe("parseOtpInput", () => {
	it("conserva solo dígitos", () => {
		expect(parseOtpInput("4a8-2")).toBe("482");
	});

	it("limita a 6 dígitos", () => {
		expect(parseOtpInput("1234567890")).toBe("123456");
	});

	it("devuelve vacío si no hay dígitos", () => {
		expect(parseOtpInput("abc")).toBe("");
	});
});

describe("shouldAutoVerifyOtp", () => {
	it("dispara la verificación exactamente al completar 6 dígitos", () => {
		expect(shouldAutoVerifyOtp("123456")).toBe(true);
	});

	it("no dispara con menos de 6", () => {
		expect(shouldAutoVerifyOtp("12345")).toBe(false);
	});

	it("no dispara con más de 6 (defensa: entrada ya saneada)", () => {
		expect(shouldAutoVerifyOtp("1234567")).toBe(false);
	});
});

describe("mapOtpVerifyError", () => {
	it("mapea TOO_MANY_ATTEMPTS (status 403) a pedir código nuevo", () => {
		expect(mapOtpVerifyError({ status: 403, message: "Too many attempts" })).toBe(
			"Demasiados intentos. Pide un código nuevo.",
		);
	});

	it("mapea por message aunque el status sea 429", () => {
		expect(mapOtpVerifyError({ status: 429, message: "TOO_MANY_ATTEMPTS" })).toBe(
			"Demasiados intentos. Pide un código nuevo.",
		);
	});

	it("mapea OTP expirado o inválido al mensaje genérico", () => {
		expect(mapOtpVerifyError({ status: 400, message: "OTP_EXPIRED" })).toBe(
			"Código incorrecto o expirado",
		);
		expect(mapOtpVerifyError({ status: 400, message: "INVALID_OTP" })).toBe(
			"Código incorrecto o expirado",
		);
	});

	it("mapea errores sin detalle al mensaje genérico", () => {
		expect(mapOtpVerifyError({})).toBe("Código incorrecto o expirado");
	});
});

describe("isUserAlreadyExistsError", () => {
	it("detecta el error por message (formato Better Auth 1.6.30)", () => {
		expect(
			isUserAlreadyExistsError({
				message: "User already exists. Use another email.",
			}),
		).toBe(true);
	});

	it("detecta el error por code con underscores", () => {
		expect(
			isUserAlreadyExistsError({
				code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
			}),
		).toBe(true);
	});

	it("no confunde otros errores", () => {
		expect(isUserAlreadyExistsError({ message: "Invalid email" })).toBe(false);
		expect(isUserAlreadyExistsError({})).toBe(false);
	});
});

describe("shouldSendOtp (guard de idempotencia del wizard)", () => {
	it("envía la primera vez (ref vacía)", () => {
		expect(shouldSendOtp(null, "a@b.com")).toBe(true);
	});

	it("NO re-envía si el email no cambió (back → adelante)", () => {
		expect(shouldSendOtp("a@b.com", "a@b.com")).toBe(false);
	});

	it("re-envía si el email cambió", () => {
		expect(shouldSendOtp("a@b.com", "nuevo@b.com")).toBe(true);
	});
});
