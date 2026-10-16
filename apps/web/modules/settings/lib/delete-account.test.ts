import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteUser = vi.fn();
const signInPasskey = vi.fn();
const signInEmailOtp = vi.fn();
const sendVerificationOtp = vi.fn();

vi.mock("@/auth/auth-client", () => ({
	authClient: {
		deleteUser: (...args: unknown[]) => deleteUser(...args),
		signIn: {
			passkey: (...args: unknown[]) => signInPasskey(...args),
			emailOtp: (...args: unknown[]) => signInEmailOtp(...args),
		},
		emailOtp: {
			sendVerificationOtp: (...args: unknown[]) => sendVerificationOtp(...args),
		},
	},
}));

import {
	SETTINGS_DELETE_ACCOUNT_ERROR,
	SETTINGS_DELETE_ACCOUNT_ERROR_OTP,
	SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD,
	SETTINGS_DELETE_ACCOUNT_ERROR_POLAR,
	SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
	SETTINGS_DELETE_ACCOUNT_OTP_SENT,
} from "../constants";
import { deleteAccount, mapDeleteAccountError } from "./delete-account";

describe("mapDeleteAccountError", () => {
	it("maps stale session codes to reauth copy", () => {
		expect(mapDeleteAccountError({ code: "SESSION_EXPIRED" })).toBe(
			SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
		);
		expect(mapDeleteAccountError({ code: "SESSION_NOT_FRESH" })).toBe(
			SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
		);
	});

	it("maps invalid password to password copy", () => {
		expect(mapDeleteAccountError({ code: "INVALID_PASSWORD" })).toBe(
			SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD,
		);
	});

	it("maps Polar cancel failure to retryable billing copy", () => {
		expect(mapDeleteAccountError({ code: "POLAR_CANCEL_FAILED" })).toBe(
			SETTINGS_DELETE_ACCOUNT_ERROR_POLAR,
		);
	});

	it("maps invalid OTP to otp copy", () => {
		expect(mapDeleteAccountError({ code: "INVALID_OTP" })).toBe(SETTINGS_DELETE_ACCOUNT_ERROR_OTP);
	});

	it("falls back to generic copy", () => {
		expect(mapDeleteAccountError({ code: "UNKNOWN" })).toBe(SETTINGS_DELETE_ACCOUNT_ERROR);
	});
});

describe("deleteAccount", () => {
	beforeEach(() => {
		deleteUser.mockReset();
		signInPasskey.mockReset();
		signInEmailOtp.mockReset();
		sendVerificationOtp.mockReset();
	});

	it("returns ok when deleteUser succeeds on a fresh session", async () => {
		deleteUser.mockResolvedValue({ error: null });
		await expect(deleteAccount()).resolves.toEqual({ ok: true });
		expect(deleteUser).toHaveBeenCalledWith(undefined);
		expect(sendVerificationOtp).not.toHaveBeenCalled();
	});

	it("passes password when provided and does not send OTP", async () => {
		deleteUser.mockResolvedValue({ error: null });
		await expect(deleteAccount({ password: " secret " })).resolves.toEqual({
			ok: true,
		});
		expect(deleteUser).toHaveBeenCalledWith({ password: "secret" });
		expect(sendVerificationOtp).not.toHaveBeenCalled();
		expect(signInEmailOtp).not.toHaveBeenCalled();
	});

	it("keeps password users on the password path when the session is stale", async () => {
		deleteUser.mockResolvedValue({
			error: { code: "SESSION_EXPIRED", message: "Session expired" },
		});

		const result = await deleteAccount({
			password: "x",
			email: "ada@example.com",
			canUsePasskey: true,
		});
		expect(result).toEqual({
			ok: false,
			message: SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
			code: "SESSION_EXPIRED",
		});
		expect(signInPasskey).not.toHaveBeenCalled();
		expect(sendVerificationOtp).not.toHaveBeenCalled();
	});

	it("reauths with passkey and retries on SESSION_EXPIRED", async () => {
		deleteUser
			.mockResolvedValueOnce({
				error: { code: "SESSION_EXPIRED", message: "Session expired" },
			})
			.mockResolvedValueOnce({ error: null });
		signInPasskey.mockResolvedValue({ error: null });

		await expect(deleteAccount({ canUsePasskey: true })).resolves.toEqual({
			ok: true,
		});
		expect(signInPasskey).toHaveBeenCalledTimes(1);
		expect(deleteUser).toHaveBeenCalledTimes(2);
		expect(sendVerificationOtp).not.toHaveBeenCalled();
	});

	it("sends a sign-in OTP when an OTP-only user has a stale session", async () => {
		deleteUser.mockResolvedValue({
			error: { code: "SESSION_EXPIRED", message: "Session expired" },
		});
		sendVerificationOtp.mockResolvedValue({ error: null });

		const result = await deleteAccount({ email: "ada@example.com" });
		expect(result).toEqual({
			ok: false,
			needsOtp: true,
			message: SETTINGS_DELETE_ACCOUNT_OTP_SENT,
		});
		expect(sendVerificationOtp).toHaveBeenCalledWith({
			email: "ada@example.com",
			type: "sign-in",
		});
		expect(deleteUser).toHaveBeenCalledTimes(1);
	});

	it("falls back to OTP when passkey reauth fails for a passwordless user", async () => {
		deleteUser.mockResolvedValue({
			error: { code: "SESSION_EXPIRED", message: "Session expired" },
		});
		signInPasskey.mockResolvedValue({
			error: { code: "PASSKEY_FAILED", message: "canceled" },
		});
		sendVerificationOtp.mockResolvedValue({ error: null });

		const result = await deleteAccount({
			email: "ada@example.com",
			canUsePasskey: true,
		});
		expect(result).toEqual({
			ok: false,
			needsOtp: true,
			message: SETTINGS_DELETE_ACCOUNT_OTP_SENT,
		});
		expect(sendVerificationOtp).toHaveBeenCalledTimes(1);
	});

	it("verifies the email OTP to refresh the session then deletes", async () => {
		signInEmailOtp.mockResolvedValue({ error: null });
		deleteUser.mockResolvedValue({ error: null });

		await expect(
			deleteAccount({ email: " ada@example.com ", otp: " 482913 " }),
		).resolves.toEqual({ ok: true });
		expect(signInEmailOtp).toHaveBeenCalledWith({
			email: "ada@example.com",
			otp: "482913",
		});
		expect(deleteUser).toHaveBeenCalledWith(undefined);
		expect(sendVerificationOtp).not.toHaveBeenCalled();
	});

	it("does not delete when the OTP is invalid", async () => {
		signInEmailOtp.mockResolvedValue({
			error: { code: "INVALID_OTP", message: "invalid" },
		});

		const result = await deleteAccount({
			email: "ada@example.com",
			otp: "000000",
		});
		expect(result).toEqual({
			ok: false,
			message: SETTINGS_DELETE_ACCOUNT_ERROR_OTP,
			code: "INVALID_OTP",
		});
		expect(deleteUser).not.toHaveBeenCalled();
	});

	it("surfaces a retryable Polar cancel failure from deleteUser", async () => {
		deleteUser.mockResolvedValue({
			error: {
				code: "POLAR_CANCEL_FAILED",
				message: "No pudimos cancelar tu suscripción.",
			},
		});

		await expect(deleteAccount()).resolves.toEqual({
			ok: false,
			message: SETTINGS_DELETE_ACCOUNT_ERROR_POLAR,
			code: "POLAR_CANCEL_FAILED",
		});
	});
});
