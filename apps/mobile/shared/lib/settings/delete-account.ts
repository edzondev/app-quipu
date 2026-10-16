import { authClient } from "@/lib/auth-client";

export const DELETE_ACCOUNT_ERROR = "No pudimos eliminar tu cuenta. Intenta de nuevo.";
export const DELETE_ACCOUNT_ERROR_REAUTH =
	"Por seguridad, confirma con passkey o escribe tu contraseña.";
export const DELETE_ACCOUNT_ERROR_PASSWORD = "La contraseña no es correcta.";

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

export function mapDeleteAccountError(error: AuthClientError): string {
	if (isStaleSessionError(error)) {
		return DELETE_ACCOUNT_ERROR_REAUTH;
	}
	if (isInvalidPasswordError(error)) {
		return DELETE_ACCOUNT_ERROR_PASSWORD;
	}
	return DELETE_ACCOUNT_ERROR;
}

/**
 * Same Better Auth `/delete-user` flow as web (`apps/web/modules/settings/lib/delete-account.ts`).
 * Fresh session or password; stale passkey sessions reauth once and retry.
 * Convex cleanup runs in the server `onDelete` trigger — this client only calls deleteUser.
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
