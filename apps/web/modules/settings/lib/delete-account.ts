import { authClient } from "@/auth/auth-client";
import {
	SETTINGS_DELETE_ACCOUNT_ERROR,
	SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD,
	SETTINGS_DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
	SETTINGS_DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE,
	SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
} from "../constants";

type AuthClientError = {
	code?: string | undefined;
	message?: string | undefined;
};

type DeleteAccountResult = { ok: true } | { ok: false; message: string; code?: string };

function isStaleSessionError(error: AuthClientError): boolean {
	const code = error.code?.toUpperCase() ?? "";
	const message = error.message?.toLowerCase() ?? "";
	return (
		code === "SESSION_EXPIRED" ||
		code === "SESSION_NOT_FRESH" ||
		message.includes("session expired") ||
		message.includes("session is not fresh") ||
		message.includes("re-authenticate")
	);
}

function isInvalidPasswordError(error: AuthClientError): boolean {
	const code = error.code?.toUpperCase() ?? "";
	const message = error.message?.toLowerCase() ?? "";
	return (
		code === "INVALID_PASSWORD" ||
		code === "CREDENTIAL_ACCOUNT_NOT_FOUND" ||
		message.includes("invalid password") ||
		message.includes("credential account")
	);
}

function polarErrorCopy(error: AuthClientError): string | null {
	const code = error.code?.toUpperCase() ?? "";
	if (code === "POLAR_SUBSCRIPTION_ACTIVE") {
		return SETTINGS_DELETE_ACCOUNT_ERROR_POLAR_ACTIVE;
	}
	if (code === "POLAR_STATUS_UNAVAILABLE") {
		return SETTINGS_DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE;
	}
	return null;
}

export function mapDeleteAccountError(error: AuthClientError): string {
	const polar = polarErrorCopy(error);
	if (polar !== null) return polar;
	if (isStaleSessionError(error)) {
		return SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH;
	}
	if (isInvalidPasswordError(error)) {
		return SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD;
	}
	return SETTINGS_DELETE_ACCOUNT_ERROR;
}

/**
 * Better Auth exige sesión "fresh" (creada < freshAge, default 24h) o
 * contraseña para `/delete-user`. Sin eso responde SESSION_EXPIRED.
 *
 * Web: passkey reauth si la sesión es vieja. Polar activo se bloquea en
 * beforeDelete (POLAR_SUBSCRIPTION_ACTIVE); la UI pide cancelar en el portal.
 * Teléfono: emailOTP sigue en el servidor para refrescar sesión OTP-only.
 */
export async function deleteAccount(options?: {
	password?: string;
	canUsePasskey?: boolean;
}): Promise<DeleteAccountResult> {
	const password = options?.password?.trim();
	const canUsePasskey = options?.canUsePasskey ?? false;

	const first = await authClient.deleteUser(password ? { password } : undefined);
	if (!first.error) return { ok: true };

	if (!password && canUsePasskey && isStaleSessionError(first.error)) {
		const passkey = await authClient.signIn.passkey();
		if (passkey.error) {
			return {
				ok: false,
				message: mapDeleteAccountError(first.error),
				code: first.error.code,
			};
		}
		const second = await authClient.deleteUser();
		if (!second.error) return { ok: true };
		return {
			ok: false,
			message: mapDeleteAccountError(second.error),
			code: second.error.code,
		};
	}

	return {
		ok: false,
		message: mapDeleteAccountError(first.error),
		code: first.error.code,
	};
}
