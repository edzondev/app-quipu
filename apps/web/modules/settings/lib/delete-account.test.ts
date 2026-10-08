import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteUser = vi.fn();
const signInPasskey = vi.fn();

vi.mock("@/auth/auth-client", () => ({
	authClient: {
		deleteUser: (...args: unknown[]) => deleteUser(...args),
		signIn: {
			passkey: (...args: unknown[]) => signInPasskey(...args),
		},
	},
}));

import {
	SETTINGS_DELETE_ACCOUNT_ERROR,
	SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD,
	SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
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

	it("falls back to generic copy", () => {
		expect(mapDeleteAccountError({ code: "UNKNOWN" })).toBe(SETTINGS_DELETE_ACCOUNT_ERROR);
	});
});

describe("deleteAccount", () => {
	beforeEach(() => {
		deleteUser.mockReset();
		signInPasskey.mockReset();
	});

	it("returns ok when deleteUser succeeds", async () => {
		deleteUser.mockResolvedValue({ error: null });
		await expect(deleteAccount()).resolves.toEqual({ ok: true });
		expect(deleteUser).toHaveBeenCalledWith(undefined);
	});

	it("passes password when provided", async () => {
		deleteUser.mockResolvedValue({ error: null });
		await expect(deleteAccount({ password: " secret " })).resolves.toEqual({
			ok: true,
		});
		expect(deleteUser).toHaveBeenCalledWith({ password: "secret" });
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
	});

	it("does not retry passkey when password was already provided", async () => {
		deleteUser.mockResolvedValue({
			error: { code: "SESSION_EXPIRED", message: "Session expired" },
		});

		const result = await deleteAccount({
			password: "x",
			canUsePasskey: true,
		});
		expect(result).toEqual({
			ok: false,
			message: SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
			code: "SESSION_EXPIRED",
		});
		expect(signInPasskey).not.toHaveBeenCalled();
	});
});
