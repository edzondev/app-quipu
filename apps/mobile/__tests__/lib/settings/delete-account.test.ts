const mockDeleteUser = jest.fn();
const mockSignInPasskey = jest.fn();
const mockSignInEmailOtp = jest.fn();
const mockSendVerificationOtp = jest.fn();

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
		signIn: {
			passkey: (...args: unknown[]) => mockSignInPasskey(...args),
			emailOtp: (...args: unknown[]) => mockSignInEmailOtp(...args),
		},
		emailOtp: {
			sendVerificationOtp: (...args: unknown[]) => mockSendVerificationOtp(...args),
		},
	},
}));

jest.mock("expo-network", () => ({
	getNetworkStateAsync: jest.fn(),
}));

import { ACTION_TIMEOUT_MS, OfflineError, TimeoutError } from "@/shared/lib/network/await-online";
import {
	DELETE_ACCOUNT_ERROR,
	DELETE_ACCOUNT_ERROR_OTP,
	DELETE_ACCOUNT_ERROR_PASSWORD,
	DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
	DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE,
	DELETE_ACCOUNT_ERROR_REAUTH,
	DELETE_ACCOUNT_OTP_SENT,
	deleteAccount,
	deleteAccountOnDevice,
	mapDeleteAccountError,
} from "@/shared/lib/settings/delete-account";

const { getNetworkStateAsync } = jest.requireMock("expo-network") as {
	getNetworkStateAsync: jest.Mock;
};

describe("mapDeleteAccountError", () => {
	it("maps stale session codes to reauth copy", () => {
		expect(mapDeleteAccountError({ code: "SESSION_EXPIRED" })).toBe(DELETE_ACCOUNT_ERROR_REAUTH);
		expect(mapDeleteAccountError({ code: "SESSION_NOT_FRESH" })).toBe(DELETE_ACCOUNT_ERROR_REAUTH);
	});

	it("maps invalid password to password copy", () => {
		expect(mapDeleteAccountError({ code: "INVALID_PASSWORD" })).toBe(DELETE_ACCOUNT_ERROR_PASSWORD);
	});

	it("maps invalid OTP to otp copy", () => {
		expect(mapDeleteAccountError({ code: "INVALID_OTP" })).toBe(DELETE_ACCOUNT_ERROR_OTP);
	});

	it("maps Polar codes by error.code only", () => {
		expect(mapDeleteAccountError({ code: "POLAR_SUBSCRIPTION_ACTIVE" })).toBe(
			DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
		);
		expect(mapDeleteAccountError({ code: "POLAR_STATUS_UNAVAILABLE" })).toBe(
			DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE,
		);
		expect(
			mapDeleteAccountError({
				message: "POLAR_SUBSCRIPTION_ACTIVE polar subscription is active",
			}),
		).toBe(DELETE_ACCOUNT_ERROR);
		expect(
			mapDeleteAccountError({
				message: "POLAR_STATUS_UNAVAILABLE could not check plan",
			}),
		).toBe(DELETE_ACCOUNT_ERROR);
	});

	it("falls back to generic copy", () => {
		expect(mapDeleteAccountError({ code: "UNKNOWN" })).toBe(DELETE_ACCOUNT_ERROR);
	});
});

describe("deleteAccount", () => {
	beforeEach(() => {
		mockDeleteUser.mockReset();
		mockSignInPasskey.mockReset();
		mockSignInEmailOtp.mockReset();
		mockSendVerificationOtp.mockReset();
	});

	it("returns ok when deleteUser succeeds", async () => {
		mockDeleteUser.mockResolvedValue({ error: null });
		await expect(deleteAccount()).resolves.toEqual({ ok: true });
		expect(mockDeleteUser).toHaveBeenCalledWith(undefined);
	});

	it("passes password when provided", async () => {
		mockDeleteUser.mockResolvedValue({ error: null });
		await expect(deleteAccount({ password: " secret " })).resolves.toEqual({
			ok: true,
		});
		expect(mockDeleteUser).toHaveBeenCalledWith({ password: "secret" });
	});

	it("reauths with passkey and retries on SESSION_EXPIRED", async () => {
		mockDeleteUser
			.mockResolvedValueOnce({
				error: { code: "SESSION_EXPIRED", message: "Session expired" },
			})
			.mockResolvedValueOnce({ error: null });
		mockSignInPasskey.mockResolvedValue({ error: null });

		await expect(deleteAccount({ canUsePasskey: true })).resolves.toEqual({
			ok: true,
		});
		expect(mockSignInPasskey).toHaveBeenCalledTimes(1);
		expect(mockDeleteUser).toHaveBeenCalledTimes(2);
	});

	it("guards deleteUser but not the passkey prompt", async () => {
		const guarded: string[] = [];
		mockDeleteUser
			.mockResolvedValueOnce({
				error: { code: "SESSION_EXPIRED", message: "Session expired" },
			})
			.mockResolvedValueOnce({ error: null });
		mockSignInPasskey.mockImplementation(async () => {
			expect(guarded).toEqual(["deleteUser"]);
			return { error: null };
		});

		await expect(
			deleteAccount({
				canUsePasskey: true,
				guard: async (work) => {
					guarded.push("deleteUser");
					return work();
				},
			}),
		).resolves.toEqual({ ok: true });
		expect(guarded).toEqual(["deleteUser", "deleteUser"]);
		expect(mockSignInPasskey).toHaveBeenCalledTimes(1);
	});

	it("does not retry passkey when password was already provided", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { code: "SESSION_EXPIRED", message: "Session expired" },
		});

		const result = await deleteAccount({
			password: "x",
			canUsePasskey: true,
		});
		expect(result).toEqual({
			ok: false,
			message: DELETE_ACCOUNT_ERROR_REAUTH,
			code: "SESSION_EXPIRED",
		});
		expect(mockSignInPasskey).not.toHaveBeenCalled();
	});

	it("returns Polar active copy and does not retry passkey", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { code: "POLAR_SUBSCRIPTION_ACTIVE", message: "active" },
		});
		await expect(deleteAccount({ canUsePasskey: true })).resolves.toEqual({
			ok: false,
			message: DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
			code: "POLAR_SUBSCRIPTION_ACTIVE",
		});
		expect(mockSignInPasskey).not.toHaveBeenCalled();
	});

	it("returns Polar unavailable copy and does not retry passkey", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { code: "POLAR_STATUS_UNAVAILABLE", message: "down" },
		});
		await expect(deleteAccount({ canUsePasskey: true })).resolves.toEqual({
			ok: false,
			message: DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE,
			code: "POLAR_STATUS_UNAVAILABLE",
		});
		expect(mockSignInPasskey).not.toHaveBeenCalled();
	});

	it("sends a sign-in OTP when an email-code-only user has a stale session", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { code: "SESSION_EXPIRED", message: "Session expired" },
		});
		mockSendVerificationOtp.mockResolvedValue({ error: null });

		const result = await deleteAccount({ email: "ada@example.com" });
		expect(result).toEqual({
			ok: false,
			needsOtp: true,
			message: DELETE_ACCOUNT_OTP_SENT,
		});
		expect(mockSendVerificationOtp).toHaveBeenCalledWith({
			email: "ada@example.com",
			type: "sign-in",
		});
		expect(mockSignInPasskey).not.toHaveBeenCalled();
		expect(mockDeleteUser).toHaveBeenCalledTimes(1);
	});

	it("verifies the email OTP to refresh the session then deletes", async () => {
		mockSignInEmailOtp.mockResolvedValue({ error: null });
		mockDeleteUser.mockImplementation(async () => {
			if (mockSignInEmailOtp.mock.calls.length === 0) {
				return { error: { code: "SESSION_EXPIRED", message: "Session expired" } };
			}
			return { error: null };
		});

		await expect(deleteAccount({ email: " ada@example.com ", otp: " 482913 " })).resolves.toEqual({
			ok: true,
		});
		expect(mockSignInEmailOtp).toHaveBeenCalledWith({
			email: "ada@example.com",
			otp: "482913",
		});
		expect(mockDeleteUser).toHaveBeenCalledWith(undefined);
		expect(mockSendVerificationOtp).not.toHaveBeenCalled();
	});
});

describe("deleteAccountOnDevice", () => {
	beforeEach(() => {
		mockDeleteUser.mockReset();
		getNetworkStateAsync.mockReset();
		getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
	});

	it("no llama a deleteUser si no hay red", async () => {
		getNetworkStateAsync.mockResolvedValue({ isConnected: false });
		await expect(deleteAccountOnDevice()).rejects.toEqual(new OfflineError(DELETE_ACCOUNT_ERROR));
		expect(mockDeleteUser).not.toHaveBeenCalled();
	});

	it("corta deleteUser por timeout y no envuelve el passkey", async () => {
		jest.useFakeTimers();
		try {
			mockDeleteUser.mockReturnValue(new Promise(() => undefined));
			const pending = deleteAccountOnDevice();
			const expectation = expect(pending).rejects.toEqual(new TimeoutError(DELETE_ACCOUNT_ERROR));
			await jest.advanceTimersByTimeAsync(ACTION_TIMEOUT_MS);
			await expectation;
			expect(mockSignInPasskey).not.toHaveBeenCalled();
		} finally {
			jest.useRealTimers();
		}
	});
});
