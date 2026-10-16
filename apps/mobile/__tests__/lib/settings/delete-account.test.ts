const mockDeleteUser = jest.fn();
const mockSignInPasskey = jest.fn();

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
		signIn: {
			passkey: (...args: unknown[]) => mockSignInPasskey(...args),
		},
	},
}));

import {
	DELETE_ACCOUNT_ERROR,
	DELETE_ACCOUNT_ERROR_PASSWORD,
	DELETE_ACCOUNT_ERROR_REAUTH,
	deleteAccount,
	mapDeleteAccountError,
} from "@/shared/lib/settings/delete-account";

describe("mapDeleteAccountError", () => {
	it("maps stale session codes to reauth copy", () => {
		expect(mapDeleteAccountError({ code: "SESSION_EXPIRED" })).toBe(DELETE_ACCOUNT_ERROR_REAUTH);
		expect(mapDeleteAccountError({ code: "SESSION_NOT_FRESH" })).toBe(DELETE_ACCOUNT_ERROR_REAUTH);
	});

	it("maps invalid password to password copy", () => {
		expect(mapDeleteAccountError({ code: "INVALID_PASSWORD" })).toBe(DELETE_ACCOUNT_ERROR_PASSWORD);
	});

	it("falls back to generic copy", () => {
		expect(mapDeleteAccountError({ code: "UNKNOWN" })).toBe(DELETE_ACCOUNT_ERROR);
	});
});

describe("deleteAccount", () => {
	beforeEach(() => {
		mockDeleteUser.mockReset();
		mockSignInPasskey.mockReset();
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
});
