import { parseOtpInput, shouldAutoVerifyOtp, shouldSendOtp } from "@/shared/lib/signup-flow";

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
