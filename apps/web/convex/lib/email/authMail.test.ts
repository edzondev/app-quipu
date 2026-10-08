import { afterEach, describe, expect, it, vi } from "vitest";
import { sendPasswordResetEmail, sendVerificationEmail } from "./authMail";
import * as sendModule from "./send";

const sampleParams = {
	to: "testeruser@gmail.com",
	url: "http://localhost:3000/api/auth/verify-email?token=abc123",
	name: "testeruser",
};

describe("authMail", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("logs verification URL in development without calling Resend", async () => {
		vi.stubEnv("SITE_URL", "http://localhost:3000");
		const sendSpy = vi.spyOn(sendModule, "sendOutboundEmail").mockResolvedValue(undefined);
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await sendVerificationEmail(sampleParams);

		expect(sendSpy).not.toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(sampleParams.url));
		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Resend desactivado"));
	});

	it("sends via Resend in production", async () => {
		vi.stubEnv("SITE_URL", "https://app.quipu.pe");
		const sendSpy = vi.spyOn(sendModule, "sendOutboundEmail").mockResolvedValue(undefined);

		await sendVerificationEmail(sampleParams);

		expect(sendSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				to: sampleParams.to,
				subject: expect.any(String),
				html: expect.any(String),
			}),
		);
	});

	it("logs password reset URL in development without calling Resend", async () => {
		vi.stubEnv("AUTH_EMAIL_DEV_MODE", "true");
		const sendSpy = vi.spyOn(sendModule, "sendOutboundEmail").mockResolvedValue(undefined);
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await sendPasswordResetEmail(sampleParams);

		expect(sendSpy).not.toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(sampleParams.url));
	});
});
